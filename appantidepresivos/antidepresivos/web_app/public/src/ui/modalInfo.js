import { escapeHtml } from "../core/utils.js";

export function mountInfoModal() {
  // Check if modal container exists, if not create it
  let modal = document.getElementById("infoModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "infoModal";
    modal.className = "modal-backdrop hidden";

    const styleId = "modalStyles";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
          .modal-backdrop {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
          }
          .modal-backdrop.active {
            opacity: 1; pointer-events: auto;
          }
          .modal-content {
            background: var(--color-surface);
            color: var(--color-text-main);
            border-radius: var(--radius-lg);
            width: 90%; max-width: 600px;
            max-height: 85vh; overflow-y: auto;
            box-shadow: var(--shadow-xl);
            transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid var(--color-border);
          }
          .modal-backdrop.active .modal-content {
            transform: translateY(0) scale(1);
          }
        `;
      document.head.appendChild(s);
    }

    document.body.appendChild(modal);
  }

  // Render Content
  modal.innerHTML = `
    <div class="modal-content">
      <div style="padding:var(--space-5) var(--space-6); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center;">
        <h2 class="h3" style="margin:0">Guía Clínica 2026</h2>
        <button id="btnCloseModal" type="button" class="btn btn--ghost btn--circle" style="font-size:1.2rem;">✕</button>
      </div>
      
      <div style="padding:var(--space-6);">
        
        <!-- Branding -->
        <div style="margin-bottom:24px; text-align:center;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--color-primary); font-weight:800; margin-bottom:8px;">
            Soporte CLÍNICO
          </div>
          <div style="font-size:1.75rem; font-weight:800; color:var(--color-text-main); font-family:var(--font-headers);">
            Edición Profesional
          </div>
          <div class="text-muted text-sm" style="margin-top:4px; font-weight:600">
            Actualización 2026
          </div>
        </div>

        <hr style="border:0; border-top:1px solid var(--color-border); margin:24px 0;">

        <!-- Aviso y limitaciones de uso -->
        <div class="alert alert--warning" style="font-size:0.85rem; border-radius:var(--radius-md); line-height:1.5; margin-bottom: 24px; text-align: left;">
          <strong>⚠️ Aviso y limitaciones de uso</strong><br><br>
          Esta aplicación está dirigida exclusivamente a profesionales de salud mental como apoyo clínico. No sustituye el juicio clínico, la valoración presencial, las guías oficiales ni la ficha técnica vigente de cada medicamento.<br><br>
          Las dosis, equivalencias (CPZ), estrategias de switching y contenido farmacológico son aproximaciones educativas para consulta rápida. Deben verificarse y personalizarse en cada paciente según comorbilidades, interacciones, edad, estado clínico y normativas locales.<br><br>
          Esta herramienta no está diseñada para automedicación ni para decisiones terapéuticas sin supervisión profesional.
        </div>

        <!-- Autor -->
        <div style="background:var(--color-surface-raised); padding:16px; border-radius:var(--radius-md); margin-bottom:24px; text-align: center;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-primary); font-weight:700; margin-bottom:4px;">
            Autor
          </div>
          <div style="font-weight:600; font-size:1rem; margin-bottom:8px;">
            César Celada
          </div>
          <div style="font-size:0.85rem; color:var(--color-text-muted);">
            Para aclaraciones, mejoras o sugerencias:<br>
            <a href="mailto:drceladapsiquiatria@gmail.com" style="color:var(--color-primary); text-decoration:none;">drceladapsiquiatria@gmail.com</a>
          </div>
        </div>

        <!-- Apoyo / Buy Me a Coffee -->
        <div style="text-align:center; padding:16px; background:var(--color-surface-raised); border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-text-dim); font-weight:700; margin-bottom:8px;">
            Proyecto sin fines de lucro
          </div>
          <p style="font-size:0.85rem; color:var(--color-text-muted); line-height:1.5; margin:0 0 16px; margin-inline:auto;">
            Este proyecto es sin fines de lucro. Si deseas apoyar su mantenimiento y mejoras, puedes donar en:
          </p>
          <a href="https://buymeacoffee.com/herramente"
             target="_blank"
             rel="noopener noreferrer"
             style="display:inline-flex; align-items:center; gap:8px; background:#FFDD00; color:#111; padding:11px 22px; border-radius:12px; font-weight:800; font-size:0.875rem; text-decoration:none; font-family:var(--font-headers); transition:transform 0.15s, box-shadow 0.15s; box-shadow:0 2px 8px rgba(255,221,0,0.25);"
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(255,221,0,0.45)';"
             onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 8px rgba(255,221,0,0.25)';">
            ☕ Buy Me a Coffee
          </a>
        </div>

      </div>
    </div>
  `;

  const closeBtn = modal.querySelector("#btnCloseModal");
  const close = () => modal.classList.remove("active");

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  requestAnimationFrame(() => {
    modal.classList.add("active");
  });
}
