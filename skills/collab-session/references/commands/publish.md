# `/collab publish [workspace] [topic]`

Post the session summary to GitHub Discussions so non-Claude team members can read, react,
and comment — without needing git, Claude Code, or the collab skill.

**Prerequisites:** Target repo must have Discussions enabled with a "Collab Sessions"
category (created once via GitHub web UI — categories cannot be created via API).

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main`.
3. Resolve the session (active or closed). If no arguments, use the most recently active
   session.
4. Check `_summary.md` exists and has content. If empty, prompt:
   > No summary yet — run `/collab compress` first.
5. Check `_meta.json` for existing `published_discussion_id`:
   - If present → **update** existing Discussion (idempotent re-publish)
   - If absent → **create** new Discussion
6. Determine target repo:
   - **Mini-repo:** extract owner/repo from the git remote URL.
   - **Drive:** read `publish_repo` from transport config. If not set, ask:
     "Which GitHub repo should Discussions be posted to? (owner/repo)"
     and save to transport config.
7. Get repository node ID:
   ```bash
   gh api graphql -f query='{ repository(owner:"OWNER", name:"REPO") { id } }'
   ```
8. Get "Collab Sessions" category ID:
   ```bash
   gh api graphql -f query='{ repository(owner:"OWNER", name:"REPO") {
     discussionCategories(first:25) { nodes { id name } }
   } }'
   ```
   If "Collab Sessions" not found, fall back to "General". If no categories at all,
   error: "Discussions not enabled on this repo — enable in GitHub Settings → Features."
9. Format the Discussion:
   - **Title:** `[Collab] <workspace> / <topic> — <goal snippet>`
   - **Body:** Full `_summary.md` content (phases, dead ends, discoveries, current state,
     decisions, open questions). Wikilinks are left as plain text — GitHub Discussions
     doesn't resolve them, but readers can follow the `session-NNN` reference manually.
   - **Append footer:**
     ```
     ---
     📋 Session: <workspace>/session-<NNN>_<topic>
     👥 Contributors: <list>
     💾 <N> saves · Published by <identity> · <date>
     🔗 [Raw session files](<repo-url>/tree/main/<session-path>)
     ```
10. Create or update the Discussion via `gh api graphql`:
    **Create:**
    ```bash
    gh api graphql \
      -f repositoryId='REPO_ID' \
      -f categoryId='CAT_ID' \
      -f title='TITLE' \
      -f body='BODY' \
      -f query='mutation($repositoryId:ID!,$title:String!,$body:String!,$categoryId:ID!) {
        createDiscussion(input:{repositoryId:$repositoryId,title:$title,body:$body,categoryId:$categoryId}) {
          discussion { id number url }
        }
      }'
    ```
    **Update:**
    ```bash
    gh api graphql \
      -f discussionId='DISCUSSION_ID' \
      -f body='BODY' \
      -f query='mutation($discussionId:ID!,$body:String!) {
        updateDiscussion(input:{discussionId:$discussionId,body:$body}) {
          discussion { id url }
        }
      }'
    ```
11. Update `_meta.json`: set `published_url` and `published_discussion_id`.
12. **If mini-repo:**
    ```
    git add _meta.json
    git commit -m "collab: publish — <workspace>/<topic>"
    git push origin main
    ```
13. Confirm:
    > Published to GitHub Discussions:
    > <url>
    >
    > Share this link with your team. They can comment directly.
    > Re-run `/collab publish` after `/collab compress` to update the Discussion.
