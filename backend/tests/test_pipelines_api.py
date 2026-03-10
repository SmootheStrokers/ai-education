import pytest


@pytest.mark.anyio
async def test_run_pipeline(client):
    resp = await client.post("/api/pipelines/run", json={
        "name": "Test Pipeline",
        "steps": [
            {"agent_type": "research", "params": {"topic": "test", "focus": "tools"}},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "pipeline_run_id" in data
    assert data["status"] == "running"


@pytest.mark.anyio
async def test_list_pipeline_runs(client):
    resp = await client.get("/api/pipelines")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_get_pipeline_run(client):
    # Create one first
    create_resp = await client.post("/api/pipelines/run", json={
        "name": "Test",
        "steps": [{"agent_type": "research", "params": {"topic": "test", "focus": "tools"}}],
    })
    run_id = create_resp.json()["pipeline_run_id"]

    resp = await client.get(f"/api/pipelines/{run_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pipeline_run"]["id"] == run_id


@pytest.mark.anyio
async def test_get_pipeline_not_found(client):
    resp = await client.get("/api/pipelines/99999")
    assert resp.status_code == 404
