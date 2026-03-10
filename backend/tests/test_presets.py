import pytest


@pytest.mark.anyio
async def test_get_presets(client):
    resp = await client.get("/api/presets")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    # Each preset has required fields
    for preset in data:
        assert "id" in preset
        assert "label" in preset
        assert "description" in preset
        assert "quick_runs" in preset
        assert isinstance(preset["quick_runs"], list)
        assert len(preset["quick_runs"]) >= 3
        for run in preset["quick_runs"]:
            assert "label" in run
            assert "agent_type" in run
            assert "params" in run


@pytest.mark.anyio
async def test_get_preset_by_id(client):
    resp = await client.get("/api/presets/contractor")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "contractor"


@pytest.mark.anyio
async def test_get_preset_not_found(client):
    resp = await client.get("/api/presets/nonexistent")
    assert resp.status_code == 404
