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
        <h2 class="h3" style="margin:0">Créditos</h2>
        <button id="btnCloseModal" type="button" class="btn btn--ghost btn--circle" style="font-size:1.2rem;">✕</button>
      </div>

      <div style="padding:var(--space-6);">

        <!-- Branding -->
        <div style="margin-bottom:24px; text-align:center;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--color-primary); font-weight:800; margin-bottom:8px;">
            Guía Clínica
          </div>
          <div style="font-size:1.75rem; font-weight:800; color:var(--color-text-main); font-family:var(--font-headers);">
            Antidepresivos 2026
          </div>
          <div class="text-muted text-sm" style="margin-top:4px; font-weight:600">
            Edición Profesional • Soporte Clínico
          </div>
        </div>

        <hr style="border:0; border-top:1px solid var(--color-border); margin:24px 0;">

        <!-- Créditos principales -->
        <div style="background:linear-gradient(135deg, var(--color-primary-light) 0%, rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.08) 100%); padding:20px; border-radius:var(--radius-lg); margin-bottom:24px; border-left:4px solid var(--color-primary);">
          <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:2px; color:var(--color-primary); font-weight:800; margin-bottom:12px;">
            ✓ Desarrollado por
          </div>
          <div style="font-weight:800; font-size:1.5rem; margin-bottom:8px; color:var(--color-text-main);">
            Dr. César Celada
          </div>
          <div style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:16px; line-height:1.6;">
            Psiquiatra especializado en psicofarmacología clínica. Edición y compilación de información farmacológica actualizada para profesionales de la salud mental.
          </div>
          <div style="font-size:0.8rem; color:var(--color-text-muted);">
            <strong>Contacto:</strong><br>
            <a href="mailto:drceladapsiquiatria@gmail.com" style="color:var(--color-primary); text-decoration:none; font-weight:600;">drceladapsiquiatria@gmail.com</a>
          </div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:8px;">
            <strong>Comentarios, dudas o errores:</strong> Envía un correo al email anterior con tu consulta.
          </div>
        </div>

        <!-- Aviso y limitaciones de uso -->
        <div class="alert alert--warning" style="font-size:0.85rem; border-radius:var(--radius-md); line-height:1.5; margin-bottom: 24px; text-align: left;">
          <strong>⚠️ Aviso y limitaciones de uso</strong><br><br>
          Esta aplicación está dirigida exclusivamente a profesionales de salud mental como apoyo clínico. No sustituye el juicio clínico, la valoración presencial, las guías oficiales ni la ficha técnica vigente de cada medicamento.<br><br>
          Las dosis, equivalencias (CPZ), estrategias de switching y contenido farmacológico son aproximaciones educativas para consulta rápida. Deben verificarse y personalizarse en cada paciente según comorbilidades, interacciones, edad, estado clínico y normativas locales.<br><br>
          Esta herramienta no está diseñada para automedicación ni para decisiones terapéuticas sin supervisión profesional.
        </div>

        <!-- Apoyo / Buy Me a Coffee -->
        <div style="background:var(--color-surface-raised); padding:20px; border-radius:var(--radius-lg); text-align:center; border:2px dashed var(--color-border);">
          <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:2px; color:var(--color-text-dim); font-weight:800; margin-bottom:12px;">
            ☕ Apoya el proyecto
          </div>
          <p style="font-size:0.9rem; color:var(--color-text-muted); line-height:1.6; margin:0 0 16px;">
            Este es un proyecto <strong>sin fines de lucro</strong> que se mantiene de forma independiente. Si esta herramienta es útil en tu práctica clínica, considera hacer una pequeña donación para apoyar su desarrollo y mejoras continuas.
          </p>
          <a href="https://buymeacoffee.com/herramente"
             target="_blank"
             rel="noopener noreferrer"
             style="display:inline-flex; align-items:center; gap:8px; background:#FFDD00; color:#111; padding:12px 24px; border-radius:10px; font-weight:800; font-size:0.9rem; text-decoration:none; font-family:var(--font-headers); transition:all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 4px 12px rgba(255,221,0,0.35); border:none; cursor:pointer;"
             onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(255,221,0,0.5)';"
             onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(255,221,0,0.35)';">
            ☕ Invitar un café
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
