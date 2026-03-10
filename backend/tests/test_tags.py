import pytest
from database import init_db, create_run


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.fixture
async def run_id():
    """Create a run directly in DB to avoid triggering background agent tasks."""
    return await create_run("research", '{"topic": "test", "focus": "tools"}')


@pytest.mark.anyio
async def test_add_tag_to_run(client, run_id):
    # Add tag
    resp = await client.post(f"/api/runs/{run_id}/tags", json={"tag": "contractor"})
    assert resp.status_code == 200

    # Get tags
    resp = await client.get(f"/api/runs/{run_id}/tags")
    assert resp.status_code == 200
    assert "contractor" in resp.json()


@pytest.mark.anyio
async def test_remove_tag_from_run(client, run_id):
    await client.post(f"/api/runs/{run_id}/tags", json={"tag": "realtor"})
    resp = await client.delete(f"/api/runs/{run_id}/tags/realtor")
    assert resp.status_code == 200

    tags_resp = await client.get(f"/api/runs/{run_id}/tags")
    assert "realtor" not in tags_resp.json()


@pytest.mark.anyio
async def test_list_all_tags(client):
    resp = await client.get("/api/tags")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_filter_runs_by_tag(client):
    resp = await client.get("/api/runs?tag=contractor")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
