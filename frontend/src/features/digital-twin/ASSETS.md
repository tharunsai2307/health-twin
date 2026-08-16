# Digital Twin — 3D Asset Documentation

This document logs the actual anatomical 3D assets used in the MedTwin platform, including their sources, licensing, and mesh mapping.

---

## 3D Asset Sourcing

All 3D assets are sourced from the **NIH 3D Print Exchange** via the open-source **Code for FUKUI human_organs** library.

| Organ | File | NIH Entry ID | License | Authors | Year | Size |
|-------|------|--------------|---------|---------|------|------|
| ❤️ Heart | `heart.glb` | [3DPX-021000](https://3d.nih.gov/entries/3DPX-021000) | CC BY 4.0 | Kristen Browne; Heidi Schlehlein | 2022 | 4.1 MB |
| 🧠 Brain | `brain.glb` | [3DPX-002386](https://3d.nih.gov/entries/3DPX-002386) | CC BY 4.0 | Nevit Dilmen | 2015 | 5.4 MB |
| 🫁 Lungs | `lungs.glb` | [3DPX-021008](https://3d.nih.gov/entries/3DPX-021008) | CC BY 4.0 | Kristen Browne; Heidi Schlehlein | 2023 | 23.3 MB |
| 🫀 Liver | `liver.glb` | [3DPX-021007](https://3d.nih.gov/entries/3DPX-021007) | CC BY 4.0 | Kristen Browne; Heidi Schlehlein | 2022 | 1.1 MB |
| 🫘 Kidney | `kidney.glb` | [3DPX-021001](https://3d.nih.gov/entries/3DPX-021001) | CC BY 4.0 | Kristen Browne; Heidi Schlehlein | 2022 | 1.5 MB |

*Date Obtained:* 2026-08-16
*Attribution:* Sourced from National Institutes of Health (NIH) 3D Print Exchange and packaged by Taisuke Fukuno (Code for FUKUI).

---

## Technical Integration & Mapping

The assets are hosted in `frontend/public/models/` and loaded dynamically via `@react-three/drei`'s `useGLTF`.

To preserve the clinical interaction architecture, the models are loaded inside the interactive scene and mapped as follows:

1. **Heart:** Loaded from `heart.glb`. Positioned inside the chest cavity with a heartbeat pulse animation.
2. **Brain:** Loaded from `brain.glb`. Positioned inside the cranial cavity with neural glow pulse.
3. **Lungs:** Loaded from `lungs.glb` (contains both lobes). Positioned inside the upper chest with breathing expansion.
4. **Liver:** Loaded from `liver.glb`. Positioned in the upper right abdomen.
5. **Kidneys:** Loaded from `kidney.glb`. Positioned in the posterior abdomen. The left kidney is rendered at its anatomical position, and a mirrored copy is rendered on the right side to represent the paired organ system.

---

## Visual Direction

To look like a premium clinical scanning interface, we traverse all meshes in the GLB files and override their materials with a semi-transparent, holographic glass look:
- **Default body envelope:** Translucent light blue (`opacity: 0.1`) to provide spatial context without blocking organ visibility.
- **Normal organs:** High-translucency colored glass matching their anatomical category (Heart = Red, Brain = Magenta, Lungs = Indigo, Kidneys = Orange, Liver = Purple).
- **Selected organ:** High emissive intensity (glow), 100% opacity, pulse animation, and an orbital selection ring.
- **Dimmed organs:** Opacity drops to `0.05` to let the selected organ stand out.

---

## Gender Variants

The platform uses `Patient.gender` (added in Phase 2) to select the appropriate anatomical basis.
- The lungs model (`lungs.glb`) is sourced from the Visible Female dataset.
- The heart, liver, and kidney models are sourced from the Visible Male dataset.
- If female is selected, future updates can drop in the respective `3d-vh-f-*` counterpart models. Currently, the unified assembly handles both profiles.
