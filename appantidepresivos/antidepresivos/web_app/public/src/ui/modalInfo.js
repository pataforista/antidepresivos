
export function mountInfoModal() {
    // Check if modal container exists, if not create it
    let modal = document.getElementById("infoModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "infoModal";
        modal.className = "modal-backdrop hidden"; // Needs CSS for .modal-backdrop & .hidden
        // We'll inject styles just in case or assume layout.css has them (we'll ensure basics)
        // For now, simpler: inline style approach for the backdrop + class toggling

        // Inject styles dynamically if not present to ensure it works immediately
        const styleId = "modalStyles";
        if (!document.getElementById(styleId)) {
            const s = document.createElement("style");
            s.id = styleId;
            s.textContent = `
          .modal-backdrop {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            opacity: 0; pointer-events: none; transition: opacity 0.2s;
            backdrop-filter: blur(4px);
          }
          .modal-backdrop.active {
            opacity: 1; pointer-events: auto;
          }
          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%; max-width: 600px;
            max-height: 90vh; overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transform: translateY(10px); transition: transform 0.2s;
          }
          .modal-backdrop.active .modal-content {
            transform: translateY(0);
          }
        `;
            document.head.appendChild(s);
        }

        document.body.appendChild(modal);
    }

    // Render Content
    modal.innerHTML = `
    <div class="modal-content">
      <div style="padding:24px; border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center;">
        <h2 class="h3" style="margin:0">Acerca de esta App</h2>
        <button id="btnCloseModal" type="button" class="btn btn--ghost" style="padding:4px 8px; font-size:1.2rem; line-height:1;">✕</button>
      </div>
      
      <div style="padding:24px;">
        
        <!-- Autoría -->
        <div style="margin-bottom:24px; text-align:center;">
          <div style="font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; color:var(--color-primary); font-weight:700; margin-bottom:8px;">
            Investigación y Desarrollo
          </div>
          <div style="font-size:1.5rem; font-weight:700; color:var(--color-text-main);">
            Dr. Cesar Celada
          </div>
          <div class="text-muted text-sm" style="margin-top:4px;">
            Médico Psiquiatra
          </div>
        </div>

        <hr style="border:0; border-top:1px solid var(--color-border); margin:24px 0;">

        <!-- Fuentes -->
        <h4 class="h4" style="margin-bottom:12px">Fuentes Bibliográficas</h4>
        <p class="text-body text-sm" style="margin-bottom:16px;">
          La información contenida en esta aplicación ha sido compilada y verificada cruzando datos de fuentes farmacológicas estándar y agencias regulatorias, incluyendo:
        </p>
        <ul class="list-disc text-sm text-muted" style="padding-left:20px; margin-bottom:24px; display:grid; gap:4px;">
           <li><strong>FDA Prescribing Information (Labels)</strong>: Datos de black box warnings, indicaciones aprobadas y seguridad.</li>
           <li><strong>Agencia Europea de Medicamentos (EMA)</strong>: Fichas técnicas autorizadas.</li>
           <li><strong>Literatura Estándar</strong>: Stahl's Essential Psychopharmacology, Maudsley Prescribing Guidelines.</li>
           <li><strong>PubChem & DrugBank</strong>: Datos fisicoquímicos y farmacocinéticos básicos.</li>
        </ul>

        <!-- Disclaimers -->
        <div class="alert alert--info" style="font-size:0.85rem;">
          <strong>Aviso Legal & Responsabilidad</strong><br>
          Esta aplicación es una herramienta de consulta rápida dirigida exclusivamente a <strong>profesionales de la salud</strong>. 
          No sustituye el juicio clínico ni la consulta de las fuentes primarias de prescripción. 
          El autor no se hace responsable de decisiones clínicas tomadas basadas únicamente en esta herramienta.
          <br><br>
          En caso de discrepancia, siempre prevalece la información oficial local de su país (Cofepris, AEMPS, FDA, etc.).
        </div>

        <div style="text-align:center; margin-top:24px; font-size:0.75rem; color:var(--color-text-lighter);">
          © ${new Date().getFullYear()} • Dr. Cesar Celada • Todos los derechos reservados.
        </div>

      </div>
    </div>
  `;

    // Interaction
    const closeBtn = modal.querySelector("#btnCloseModal");
    const close = () => modal.classList.remove("active");

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
    });

    // Open immediately
    requestAnimationFrame(() => {
        modal.classList.add("active");
    });
}
