# QuickStart

## --- Install dependencies ---
%pip install -q langchain langchain-anthropic langchain-openai anthropic openai \
    python-dotenv pandas numpy scikit-learn nltk spacy matplotlib seaborn

## --- Load environment variables (.env should contain ANTHROPIC_API_KEY / OPENAI_API_KEY) ---
from dotenv import load_dotenv
import os

load_dotenv()

anthropic_key = os.getenv("ANTHROPIC_API_KEY")
openai_key = os.getenv("OPENAI_API_KEY")

assert anthropic_key or openai_key, "No API key found — add ANTHROPIC_API_KEY or OPENAI_API_KEY to your .env file"

## --- Core imports used throughout the notebook ---
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns