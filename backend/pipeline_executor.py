import asyncio
import json
from database import (
    create_run,
    complete_run,
    fail_run,
    get_run,
    complete_pipeline_run,
    fail_pipeline_run,
)
from agents import AGENT_REGISTRY
from html_generator import save_html
import design_agent


async def execute_pipeline(pipeline_run_id: int, name: str, steps: list[dict]):
    """Execute a pipeline: run agents sequentially, chaining outputs."""
    prior_output = ""

    try:
        for i, step in enumerate(steps):
            agent_type = step["agent_type"]
            params = dict(step.get("params", {}))

            # Chain: inject prior output as source_material
            if prior_output:
                params["source_material"] = prior_output

            if agent_type not in AGENT_REGISTRY:
                raise ValueError(f"Unknown agent type in pipeline step {i}: {agent_type}")

            # Create agent run linked to pipeline
            run_id = await create_run(
                agent_type,
                json.dumps(params),
                pipeline_run_id=pipeline_run_id,
                step_index=i,
            )

            # Execute agent
            agent_class = AGENT_REGISTRY[agent_type]
            agent = agent_class()
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, agent.run, params)

            # Generate HTML
            html_path = None
            try:
                html_content = await loop.run_in_executor(
                    None, design_agent.generate, result, agent_type, params
                )
                html_path = await loop.run_in_executor(
                    None, save_html, html_content, agent_type, params
                )
            except Exception as html_err:
                print(f"HTML generation failed for pipeline step {i}: {html_err}")

            await complete_run(run_id, result, html_output_path=html_path)

            # Pass output to next step
            prior_output = result

        await complete_pipeline_run(pipeline_run_id)

    except Exception as e:
        await fail_pipeline_run(pipeline_run_id, str(e))
