# Background
Aspect-Based Sentiment Classification (ABSC) is a fine-grained sentiment analysis task that identifies sentiment expressed toward specific aspects of a product or service, rather than a single overall sentiment for a piece of text. For example, in "The food was delicious, but the service was slow," sentiment toward food is positive while sentiment toward service is negative. This level of detail gives businesses and researchers more actionable insight into customer feedback than document-level sentiment alone.

Traditionally, ABSC has been approached with trained classifiers (e.g. fine-tuned BERT-style models). This project instead builds an ABSC pipeline using a general-purpose LLM (Claude or GPT) orchestrated through LangChain — classifying sentiment via prompting rather than task-specific model training, using the SemEval-2014 Task 4 dataset (Laptop and Restaurant reviews) as the evaluation benchmark.

# Objectives
1. Load and prepare the SemEval-2014 ABSC dataset (text, aspect term, gold sentiment label).
2. Configure an LLM via LangChain (Anthropic or OpenAI) as the classification engine.
3. Design a prompt that reliably instructs the LLM to classify sentiment for a given aspect within a review.
4. Run the LLM + prompt over a sample of the dataset to generate predictions.
5. Evaluate prediction quality against gold labels using precision, recall, F1, and accuracy.
6. Identify strengths/weaknesses of the LLM-prompting approach vs. traditional trained classifiers for ABSC, using per-class and per-aspect error analysis.

# Components

## 1. Data layer
Dataset (SemEval-2014 CSV — Laptop/Restaurant reviews) with columns for text, aspect term, and gold sentiment label
Data loader (pandas) to read and optionally sample/split the dataset

### Download/locate the dataset file -- done
Confirm Laptop_Train_v2.csv (and/or restaurant equivalent) exists locally at a known path; document the expected file location.

### Load the CSV into a pandas DataFrame -- done
Read the CSV with pd.read_csv(), print .shape and .head() to confirm it loaded correctly.

### Inspect and identify relevant columns -- done
List all columns, identify which ones map to: review text, aspect term, and gold sentiment label (SemEval CSVs often have extra/renamed columns).

### Tasks that are not needed as the dataset have already processed and Cleaned.

Rename/select columns into a standard schema -- no need
Subset/rename columns to a consistent schema, e.g. text, aspect, label, dropping unused columns.

Handle missing/malformed rows -- done
Check for and drop/report rows with nulls in text, aspect, or label.

Normalize the label values  -- no need
Inspect unique values in the label column; map them to a consistent set (e.g. positive / negative / neutral / conflict), since SemEval sometimes encodes labels as strings or numeric codes.

Write a reusable data-loading function  -- no need
Wrap steps 2–6 into a single function, e.g. load_absc_dataset(path) -> pd.DataFrame, so it can be called for both laptop and restaurant CSVs.

Sample/subset the dataset for experimentation  -- no need
Add a function or param to pull a small random sample (e.g. df.sample(n=50, random_state=...)) for cheap iteration before running on the full set.

(Optional) Train/test split  -- no need
If evaluation requires holding out data, add a split step (e.g. train_test_split from scikit-learn) — only needed if you're not using the dataset's existing train/test file split.

## 2. Environment & credentials -- not needed as we are using HuggingFace pipeline
Python env with LangChain + provider SDK (langchain-anthropic / langchain-openai)
API key loaded via .env + python-dotenv

## 3. LLM component -- done
1. Select a local text-generation model — small, instruction-tuned causal LM (chosen: Qwen/Qwen2.5-0.5B-Instruct).
2. Install required packages — langchain-huggingface, transformers, torch.
3. Build the transformers pipeline — task="text-generation", with the model loaded and cached locally.
4. Configure generation parameters on the pipeline — max_new_tokens (output length cap) and do_sample=False (deterministic/greedy decoding, standing in for temperature).
5. Wrap the pipeline in LangChain's HuggingFacePipeline — gives a LangChain-compatible LLM object (.invoke(), composable in chains).
6. Smoke-test the wrapped llm object — confirm it generates text end-to-end through the LangChain wrapper.

## 4. Prompt component -- done
A prompt template (LangChain PromptTemplate / ChatPromptTemplate) that:
Instructs the LLM on the ABSC task
Specifies the input variables (review text + aspect)
Constrains the output format (e.g. one of positive/negative/neutral/conflict)
(Using LangChain with a HuggingFace HuggingFacePipeline — a plain text-completion LLM, not a chat model)

1. Choose the template type — PromptTemplate, not ChatPromptTemplate, since the LLM object is a plain-text completion model (no system/human/assistant roles to fill).
2. Define the input variable(s) — a single sentence variable (the full review text). Aspects are not passed in as input — the LLM is responsible for identifying them from the sentence itself.
3. Write the task instruction block — define what counts as an "aspect" (short noun phrase, not adjectives/verbs) and how many are expected per sentence (1–4).
4. Define the sentiment label set — specify the exact allowed values (positive, negative, neutral, conflict) the model must choose from for each aspect.
5. Specify the output-format constraint — state that the model must output only a Python list of (aspect, sentiment) tuples, with no explanation or extra text.
6. Add few-shot examples — embed a small set of sentence → output example pairs directly in the prompt text to demonstrate the exact expected format.
7. Assemble the full template and build the PromptTemplate object — combine instructions + examples + a trailing sentence: "{sentence}" / output: cue into one template string, then construct PromptTemplate(input_variables=["sentence"], template=...).
8. Test-render the prompt — call .format(sentence=...) on a sample sentence to confirm the placeholder substitutes correctly before wiring the prompt to the LLM.

## 5. Output parser -- done
A LangChain output parser (e.g. StructuredOutputParser or a simple string parser) to convert the LLM's raw response into a clean, labeled prediction

1. Inspect real raw LLM output — run a few sample prompts through the model and look at what noise surrounds the answer (e.g. an "Explanation: ..." tail, a repeated answer in a ```python code block) to know what the parser actually needs to strip.
2. Choose the parser approach — a custom Python function wrapped in RunnableLambda, rather than a built-in LangChain parser like StructuredOutputParser/PydanticOutputParser, since the target format is a plain Python list of tuples, not JSON/a schema.
3. Write extraction logic — use a regex to locate the first well-formed [...] block within the raw text, so surrounding explanation/repeats are ignored rather than breaking parsing.
4. Safely evaluate the extracted literal — use ast.literal_eval (not eval) to convert the matched string into an actual Python list, since it won't execute arbitrary code.
5. Validate each parsed entry — keep only (aspect, sentiment) pairs where both elements are strings and sentiment is one of the four allowed values; drop anything malformed rather than letting it corrupt downstream evaluation.
6. Wrap the function as a LangChain-composable step — via RunnableLambda, so it can be piped directly after the LLM in a chain.
7. Test the parser against real (noisy) model output — confirm it correctly extracts the clean list from actual generations, not just idealized/clean input.

## 6. Chain -- done
A LangChain chain (prompt → LLM → output parser) tying the above three together into a single callable

1. Confirm the three pieces work independently first — prompt renders correctly, llm.invoke() returns text, parser cleans raw text — before composing them.
2. Compose the chain with the pipe operator — prompt | llm | parser.
3. Decide the chain's input shape — a dict matching the prompt's variable name (e.g. {"sentence": ...}), since PromptTemplate-based chains expect a dict input, not a raw string.
4. Test the full chain end-to-end on one example — confirm chain.invoke({"sentence": ...}) returns a clean parsed list, not raw text.
5. Test the chain against an edge case — e.g. a sentence likely to produce a malformed or unparseable model response, to confirm the parser degrades gracefully (returns [] or similar) rather than crashing the chain.

## 7. Inference loop - wip
Logic to iterate over dataset rows, invoke the chain per example (or batch), and collect predictions alongside gold labels

1. Decide iteration granularity — one chain call per unique review (id/Sentence), not per row, since absc_chain already extracts all aspects+sentiments for a sentence in a single call. (done)
2. Build the iterable to loop over — dedupe the dataframe on id, keep just id + Sentence. (done)
3. Add a progress indicator — wrap the loop in tqdm so long-running local inference is observable. (done)
4. Invoke the chain per example and collect predictions — call absc_chain.invoke({"sentence": ...}) per row, store the result alongside its id. (done)
5. Handle per-example failures gracefully — wrap each chain call in try/except so one bad generation (e.g. unparseable output, a runtime error) doesn't kill the whole loop; record a placeholder (empty list / error marker) for that row instead. (not yet done)
6. Attach gold labels alongside each prediction — reuse/rebuild the gold (aspect, polarity) pairs per id (similar to the earlier gold_by_sentence grouping) and align them with each row's prediction. (not yet done — currently result_laptop_df only holds predictions, no gold column)
7. Store predictions and gold labels together in the result dataframe — extend result_laptop_df with a gold-labels column (or merge with a gold-labels frame), so each row has prediction + gold side by side, ready for the evaluation component. (not yet done)
8. (Optional) Add checkpointing — periodically persist partial results to disk (e.g. every N rows) so a long local run isn't lost entirely if interrupted. (not yet done, optional)

## 8. Evaluation layer
scikit-learn metrics (classification_report, confusion_matrix) comparing predicted vs. gold labels
Accuracy / precision / recall / F1, ideally broken down per sentiment class

1. Flatten predictions and gold labels into aligned pairs — convert the per-review lists (result_laptop_df's aspect_sentiment + the gold labels attached in Component 7) into a flat list of one (gold_sentiment, predicted_sentiment) pair per matched aspect, since sklearn metrics expect flat y_true/y_pred lists, not nested per-review lists.
2. Decide the aspect-matching strategy — predicted aspect strings won't always exactly match gold aspect strings (casing, whitespace, minor wording). Define a matching rule (e.g. normalize both to lowercase/stripped, then exact match) before comparison.
3. Normalize sentiment label text on both sides — lowercase/strip predicted and gold sentiment strings so formatting differences don't cause spurious mismatches (should already hold from the parser's normalization, but worth verifying at this layer too).
4. Handle unmatched aspects — decide how to count: a gold aspect the model never predicted (missed aspect) and a predicted aspect not present in gold (extra/hallucinated aspect). Define a consistent way to fold these into evaluation (e.g. treat a missed aspect as an automatic wrong prediction, track extras separately).
5. Build the final aligned y_true / y_pred lists — apply the matching + normalization rules across the full result set to produce the two flat lists classification_report needs.
6. Compute overall metrics — run classification_report(y_true, y_pred) for accuracy/precision/recall/F1.
7. Inspect per-class breakdown — read the per-label rows of classification_report to see performance separately for positive/negative/neutral/conflict (this comes for free from the same call, but worth calling out since conflict is a small, likely low-performing class).
8. Compute a confusion matrix — confusion_matrix(y_true, y_pred) to see which sentiment classes get confused for which (e.g. neutral misread as positive).
9. Report aspect-matching quality separately from sentiment accuracy — e.g. what fraction of gold aspects were successfully matched to a predicted aspect at all, since sentiment accuracy alone hides whether the model is finding the right aspects in the first place.

## 9. (Optional) Analysis/visualization
matplotlib/seaborn for per-aspect or per-class performance breakdowns
Error inspection (misclassified examples) for qualitative review

### Per-class performance breakdown
1. Extract per-class metrics from classification_report — pull precision/recall/F1 per sentiment class out into a clean, plottable structure (e.g. a small DataFrame), since the report's default text output isn't chart-ready.
2. Plot per-class metrics as a bar chart — grouped bars (precision/recall/F1) per sentiment class via matplotlib/seaborn.
3. Plot the confusion matrix as a heatmap — seaborn.heatmap over the confusion matrix values, to visualize which sentiment classes get confused for which (e.g. neutral vs positive).

### Per-aspect performance breakdown
4. Decide an aspect grouping strategy — with 1,000+ distinct aspect strings, plotting per unique aspect isn't useful; group by the top-N most frequent aspects (or normalize near-duplicates like "battery" vs "battery life") instead.
5. Compute per-aspect accuracy — for each aspect group, calculate how often the predicted sentiment matches gold.
6. Plot per-aspect performance as a bar chart — accuracy (or count of correct/incorrect) across the top-N aspects.

### Qualitative error inspection
7. Identify misclassified examples — filter the aligned prediction/gold pairs (from Component 8) down to only the mismatches.
8. Sample and print misclassified examples — for a handful of mismatches, display the review sentence, aspect, gold sentiment, and predicted sentiment side by side for manual review.
9. (Optional) Look for error patterns — e.g. check whether errors cluster around a specific sentiment class (likely conflict, given it's the smallest/rarest class) or a specific aspect type.

This depends on Component 8's aligned y_true/y_pred (and the confusion matrix/classification_report outputs) already existing, so it's a natural next step once evaluation is in place.

# Decision Made:
## Model Choice
Qwen2.5-0.5B-Instruct vs Falcon3-3B-Instruct. The core trade-off is size vs speed.
Qwen2.5-0.5B is ~0.5B params — fast on CPU, low RAM, but weaker instruction-following/reasoning; 
Falcon3-3B/7B/10B are meaningfully larger — better classification accuracy and more robust to prompt phrasing, but noticeably slower on CPU (7B/10B can be painfully slow without a GPU) and require several GB more RAM.
=> as this is an exercise. the main goal is to understand the workflow, and how each component works. There is no need to focus on model choice right now. the faster, the better. We can swap the model in the next exercise.