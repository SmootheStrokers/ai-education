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
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """)
        await db.commit()


async def create_run(agent_type: str, input_params: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO agent_runs (agent_type, status, input_params, created_at) VALUES (?, ?, ?, ?)",
            (agent_type, "running", input_params, datetime.utcnow().isoformat()),
        )
        await db.commit()
        return cursor.lastrowid


async def complete_run(run_id: int, output: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE agent_runs SET status = ?, output = ?, completed_at = ? WHERE id = ?",
            ("completed", output, datetime.utcnow().isoformat(), run_id),
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
