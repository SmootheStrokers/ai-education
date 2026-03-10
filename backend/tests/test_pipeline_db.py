import pytest
from database import (
    init_db,
    create_pipeline_run,
    get_pipeline_run,
    list_pipeline_runs,
    complete_pipeline_run,
    fail_pipeline_run,
)


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.anyio
async def test_create_and_get_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test Pipeline", steps_json)
    assert run_id > 0

    run = await get_pipeline_run(run_id)
    assert run is not None
    assert run["name"] == "Test Pipeline"
    assert run["status"] == "running"
    assert run["steps"] == steps_json


@pytest.mark.anyio
async def test_complete_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test", steps_json)
    await complete_pipeline_run(run_id)
    run = await get_pipeline_run(run_id)
    assert run["status"] == "completed"


@pytest.mark.anyio
async def test_fail_pipeline_run():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    run_id = await create_pipeline_run("Test", steps_json)
    await fail_pipeline_run(run_id, "something broke")
    run = await get_pipeline_run(run_id)
    assert run["status"] == "failed"
    assert run["error"] == "something broke"


@pytest.mark.anyio
async def test_list_pipeline_runs():
    steps_json = '[{"agent_type": "research", "params": {}}]'
    await create_pipeline_run("Run A", steps_json)
    await create_pipeline_run("Run B", steps_json)
    runs = await list_pipeline_runs()
    assert len(runs) >= 2
