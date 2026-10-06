# n8n Infra Config

Reference copy of the Docker stack running n8n in production, per `BOOKING_SYSTEM_PLAN.md` Part 3. **These files are documentation only — the live versions run on the Hetzner VPS at `~/n8n-stack`, not here.** Nothing in this folder runs locally.

**Status: live and confirmed working** at `https://n8n.thuwork.digital` (real Let's Encrypt cert, all 3 containers running). All 3 booking workflows have been migrated here from local n8n and pass the full end-to-end test — see `BOOKING_TESTING.md` "Production deployment."

- **Server**: Hetzner Cloud CX22, Falkenstein/Nuremberg (EU) region, IP `2.29.16.65` — chosen over a US region because it was ~5x cheaper for the same spec, and this workload (backend webhook/automation calls, never an interactive page) doesn't care about the extra EU↔US latency.
- **Domain**: `n8n.thuwork.digital` (A record added in Netlify DNS, since Netlify hosts `thuwork.digital`'s DNS even though the domain was registered via Namecheap)
- **Stack**: n8n (official image) + Postgres 16 (backing DB) + Caddy 2 (reverse proxy, automatic HTTPS via Let's Encrypt)

## Gotcha: SSH access

If you ever need to log in and hit "Permission denied (publickey,password)" despite the key looking correct: Hetzner's **browser console** (server page → Rescue tab → Reset root password) is the reliable fallback — it logs in via your Hetzner account, not SSH, and works even when key-based SSH is completely broken. From there you can inspect/fix `~/.ssh/authorized_keys` directly. Remember to re-disable `PasswordAuthentication` in `/etc/ssh/sshd_config.d/50-cloud-init.conf` afterward if you temporarily enable it to debug — don't leave password auth on.

## Files
- `docker-compose.yml` — the three services (postgres, n8n, caddy)
- `Caddyfile` — reverse proxy config; Caddy auto-provisions the TLS cert for `n8n.thuwork.digital` on first start
- `.env.example` — template for the two secrets the compose file needs. **Never commit the real `.env`** — it holds `POSTGRES_PASSWORD` and `N8N_ENCRYPTION_KEY` (the latter encrypts every credential n8n stores; losing it breaks all of them, leaking it exposes all of them). The real `.env` lives only on the server, generated via `openssl rand -hex 24` for each value.

## To reproduce/redeploy
1. `ssh root@<server-ip>`
2. `mkdir -p ~/n8n-stack && cd ~/n8n-stack`
3. Recreate `.env` from `.env.example`'s shape, with freshly generated values (or the real saved ones, if restoring rather than starting fresh)
4. Copy `docker-compose.yml` and `Caddyfile` from this folder onto the server (`nano` + paste, or `scp`)
5. `docker compose up -d`
