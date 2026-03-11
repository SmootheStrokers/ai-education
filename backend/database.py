import aiosqlite
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "agent_outputs.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                input_params TEXT NOT NULL,
                output TEXT,
                error TEXT,
                html_output_path TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """)
        # Add html_output_path column if upgrading from older schema
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN html_output_path TEXT")
        except Exception:
            pass  # Column already exists
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                steps TEXT NOT NULL,
                error TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """)
        # Add pipeline_run_id to agent_runs if not present
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN pipeline_run_id INTEGER")
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN step_index INTEGER")
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN review_status TEXT DEFAULT 'pending'")
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE agent_runs ADD COLUMN video_output_path TEXT")
        except Exception:
            pass
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS run_tags (
                run_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (run_id, tag_id)
            )
        """)
        await db.commit()


async def create_run(agent_type: str, input_params: str, pipeline_run_id: int | None = None, step_index: int | None = None) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO agent_runs (agent_type, status, input_params, pipeline_run_id, step_index, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (agent_type, "running", input_params, pipeline_run_id, step_index, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid


async def complete_run(run_id: int, output: str, html_output_path: str | None = None, video_output_path: str | None = None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET status = ?, output = ?, html_output_path = ?, video_output_path = ?, completed_at = ? WHERE id = ?",
            ("completed", output, html_output_path, video_output_path, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def fail_run(run_id: int, error: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET status = ?, error = ?, completed_at = ? WHERE id = ?",
            ("failed", error, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def get_run(run_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM agent_runs WHERE id = ?", (run_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def list_runs(agent_type: str | None = None, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if agent_type:
            cursor = await db.execute(
                "SELECT * FROM agent_runs WHERE agent_type = ? ORDER BY created_at DESC LIMIT ?",
                (agent_type, limit),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT ?", (limit,)
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def create_pipeline_run(name: str, steps: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO pipeline_runs (name, status, steps, created_at) VALUES (?, ?, ?, ?)",
            (name, "running", steps, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid


async def get_pipeline_run(run_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM pipeline_runs WHERE id = ?", (run_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def list_pipeline_runs(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def complete_pipeline_run(run_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE pipeline_runs SET status = ?, completed_at = ? WHERE id = ?",
            ("completed", datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def fail_pipeline_run(run_id: int, error: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE pipeline_runs SET status = ?, error = ?, completed_at = ? WHERE id = ?",
            ("failed", error, datetime.utcnow().isoformat(), run_id),
        )
        await db.commit()


async def get_pipeline_agent_runs(pipeline_run_id: int) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM agent_runs WHERE pipeline_run_id = ? ORDER BY step_index",
            (pipeline_run_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def add_tag_to_run(run_id: int, tag_name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        # Ensure tag exists
        await db.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
        cursor = await db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_row = await cursor.fetchone()
        tag_id = tag_row[0]
        await db.execute("INSERT OR IGNORE INTO run_tags (run_id, tag_id) VALUES (?, ?)", (run_id, tag_id))
        await db.commit()


async def remove_tag_from_run(run_id: int, tag_name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_row = await cursor.fetchone()
        if tag_row:
            await db.execute("DELETE FROM run_tags WHERE run_id = ? AND tag_id = ?", (run_id, tag_row[0]))
            await db.commit()


async def get_run_tags(run_id: int) -> list[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT t.name FROM tags t JOIN run_tags rt ON t.id = rt.tag_id WHERE rt.run_id = ?",
            (run_id,),
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def list_all_tags() -> list[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT name FROM tags ORDER BY name")
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def update_review_status(run_id: int, review_status: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET review_status = ? WHERE id = ?",
            (review_status, run_id),
        )
        await db.commit()


async def list_runs_by_tag(tag_name: str, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """SELECT ar.* FROM agent_runs ar
               JOIN run_tags rt ON ar.id = rt.run_id
               JOIN tags t ON rt.tag_id = t.id
               WHERE t.name = ?
               ORDER BY ar.created_at DESC LIMIT ?""",
            (tag_name, limit),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
