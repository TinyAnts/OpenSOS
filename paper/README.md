# OpenSOS — figure generator

Re-runnable notebook that recreates every figure in the paper.

## Run
1. `pip install matplotlib pillow numpy jupyter`
2. `jupyter notebook OpenSOS_figures.ipynb`  (or open in VS Code)
3. Edit the data block in the first code cell if needed, then **Run All**.

Outputs are written to `figures/`. App screenshots live in `screens/`.

| Output file | Paper figure |
|---|---|
| fig1_architecture.png | Fig 1 — architecture |
| fig2_screens_core.png | Fig 2 — screenshots (core flow) |
| fig3_screens_setup.png | Fig 3 — screenshots (setup) |
| fig4_os_share.png | Fig 4 — mobile OS share |
| fig5_coverage.png | Fig 5 — feature availability |
| fig6_reach.png | Fig 6 — cross-platform reach |

To refresh the screenshots, run `npm run preview:screenshots` in the OpenSOS app
repo and copy the new PNGs into `screens/`.
