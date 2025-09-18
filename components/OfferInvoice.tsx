import React, { useState, useEffect } from "react";
import type { ProjectData } from "..";
import { saveProject } from "../utils/dataStorage";
import type { SettingsData } from "../utils/dataStorage";

interface Props {
  setStep: (step: string) => void;
  projectData: ProjectData | null;
  setAllProjects: React.Dispatch<React.SetStateAction<ProjectData[]>>;
  settings: SettingsData | null;
}

const OfferInvoice: React.FC<Props> = ({ setStep, projectData, setAllProjects, settings }) => {
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectData?.client) {
      setClientName(projectData.client.name);
      setClientAddress(projectData.client.address);
      setClientEmail(projectData.client.email);
    }
  }, [projectData]);

  const getFullProjectData = (): ProjectData | null => {
    if (!projectData) return null;
    return {
        ...projectData,
        client: {
            name: clientName,
            address: clientAddress,
            email: clientEmail
        }
    };
  }

  const generateInvoiceHTML = (project: ProjectData, settings: SettingsData | null): string => {
    const companyName = settings?.companyName || "Igor Lozar s.p.";
    const companyAddress = settings?.companyAddress?.replace(/\n/g, '<br>') || "Cesta 123<br>1000 Ljubljana";
    const companyPhone = settings?.phone || "";
    const companyEmail = settings?.email || "";
    const companyTaxId = settings?.taxID || "";
    const logo = settings?.logo;
    const vatRate = settings?.vatRate || 22;
    const invoiceFooterText = settings?.invoiceFooterText;

    const costs = project.costs!;
    const materials = project.materials!;
    const client = project.client!;

    const vatAmount = costs.totalCost * (vatRate / 100);
    const totalWithVat = costs.totalCost + vatAmount;

    return `
      <!DOCTYPE html>
      <html lang="sl">
      <head>
          <meta charset="UTF-8" />
          <title>Ponudba ${project.id}</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; color: #333; }
              .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; background-color: #fff; }
              h1, h2, h3 { color: #2c3e50; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
              .company-details, .client-details { width: 48%; }
              .company-details p { margin: 2px 0; }
              .total-section { text-align: right; margin-top: 30px; }
              .total-section p { margin: 5px 0; }
              .total-section h3 { color: #27ae60; }
              .ar-image { max-width: 100%; margin-top: 20px; border-radius: 8px; border: 1px solid #ddd; }
              .notes { white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
              .footer-notes { margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #777; font-size: 12px; }
              @media print {
                  body { margin: 0; padding: 0; background-color: #fff; }
                  .invoice-box { box-shadow: none; border: none; }
              }
          </style>
      </head>
      <body>
          <div class="invoice-box">
              <div class="header-flex">
                  <div class="company-details">
                      ${logo ? `<img src="${logo}" alt="Logotip" style="max-width: 150px; margin-bottom: 20px;">` : ''}
                      <h2>${companyName}</h2>
                      <p>${companyAddress}</p>
                      ${companyPhone ? `<p>Telefon: ${companyPhone}</p>` : ''}
                      ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
                      ${companyTaxId ? `<p>Davčna št.: ${companyTaxId}</p>` : ''}
                  </div>
                  <div class="client-details" style="text-align: right;">
                      <h3>Ponudba za:</h3>
                      <p><strong>${client.name}</strong><br>${client.address.replace(/\n/g, '<br>')}</p>
                      <p>Datum: ${new Date().toLocaleDateString('sl-SI')}</p>
                  </div>
              </div>
              
              <h3>Specifikacija projekta ograje</h3>
              <p>
                  <strong>Tip sistema:</strong> ${project.fenceSystemType || 'N/A'}<br>
                  <strong>Opis:</strong> ${project.fenceType || 'N/A'}<br>
                  <strong>Dimenzije:</strong> Dolžina ${project.fenceLength}m, Višina ${project.fenceHeight}m<br>
                  <strong>Število vrat:</strong> ${project.gates || 0}
              </p>
              
              <h3>Stroškovnik</h3>
              <table>
                  <thead>
                      <tr><th>Postavka</th><th>Količina</th><th style="text-align: right;">Cena</th></tr>
                  </thead>
                  <tbody>
                      <tr><td>Material (paneli, stebri, vijaki, beton)</td><td>${materials.panels} panelov, ${materials.posts} stebrov</td><td style="text-align: right;">${costs.materialCost.toFixed(2)} €</td></tr>
                      <tr><td>Delo</td><td>-</td><td style="text-align: right;">${costs.laborCost.toFixed(2)} €</td></tr>
                  </tbody>
              </table>
              
              <div class="total-section">
                  <p>Skupaj (brez DDV): <strong>${costs.totalCost.toFixed(2)} €</strong></p>
                  <p>DDV (${vatRate}%): <strong>${vatAmount.toFixed(2)} €</strong></p>
                  <hr>
                  <h3>Končna cena z DDV: ${totalWithVat.toFixed(2)} €</h3>
              </div>
              
               ${// FIX: Property 'notes' does not exist on type 'ProjectData'. Use 'projectNotes' instead.
project.projectNotes ? `
                <div>
                  <h3>Opombe k projektu</h3>
                  <p class="notes">${project.projectNotes}</p>
                </div>
              ` : ''}
              
               ${invoiceFooterText ? `
                <div class="footer-notes">
                  <p>${invoiceFooterText.replace(/\n/g, '<br>')}</p>
                </div>
              ` : ''}
          </div>
      </body>
      </html>
    `;
  }

  const handlePrintOrPDF = async () => {
    const fullData = getFullProjectData();
    if (!fullData || !fullData.materials || !fullData.costs) {
        alert("Ni dovolj podatkov za generiranje ponudbe. Prosimo, najprej naredite izračun.");
        return;
    }
    if (!clientName || !clientAddress) {
        alert("Prosimo, vnesite ime in naslov stranke.");
        return;
    }
    
    setLoading(true);
    
    const htmlContent = generateInvoiceHTML(fullData, settings);
    const win = window.open('', '_blank');

    if (win) {
        win.document.write(htmlContent);
        win.document.close();
        // Delay print slightly to ensure all content (especially images) is rendered
        setTimeout(() => {
            win.focus();
            win.print();
        }, 500);
    } else {
        alert("Generiranje ponudbe je bilo blokirano. Prosimo, omogočite pojavna okna v vašem brskalniku.");
    }

    setLoading(false);
  };

  const handleSendEmail = () => {
    const fullData = getFullProjectData();
    if (!fullData || !fullData.costs) {
        alert("Prosimo, najprej pripravite izračun, da lahko pošljete ponudbo.");
        return;
    }
    if (!clientEmail) {
        alert("Vnesite e-mail naslov stranke.");
        return;
    }

    const totalWithVat = (fullData.costs.totalCost * (1 + (settings?.vatRate || 22) / 100)).toFixed(2);
    const subject = `Ponudba za PVC ograjo - ${settings?.companyName || 'Igor Lozar s.p.'}`;
    const body = `
Pozdravljeni,

v priponki oziroma novem zavihku boste našli podrobno ponudbo za izdelavo in montažo PVC ograje.

Kratek povzetek ponudbe:
- Tip ograje: ${fullData.fenceType || 'N/A'}
- Dolžina: ${fullData.fenceLength}m
- Končna cena z DDV: ${totalWithVat} €

Za vsa dodatna vprašanja in pojasnila sem vam na voljo.

Lep pozdrav,
${settings?.companyName || 'Igor Lozar s.p.'}
    `.trim();

    const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const handleSaveProject = async () => {
    const fullData = getFullProjectData();
     if (!fullData) {
        alert("Ni podatkov o projektu za shranjevanje.");
        return;
    }
    if (!clientName) {
        alert("Vnesite vsaj ime stranke, da lahko shranite projekt.");
        return;
    }
    try {
        await saveProject(fullData);
        // Optimistically update the local state to reflect the change immediately
        setAllProjects(prev => {
            const existingIndex = prev.findIndex(p => p.id === fullData.id);
            if (existingIndex > -1) {
                return prev.map((p, i) => i === existingIndex ? fullData : p);
            }
            return [...prev, fullData];
        });
        alert(`Projekt za "${clientName}" je bil shranjen!`);
        setStep('projects');
    } catch (error) {
        alert(`Napaka pri shranjevanju projekta: ${error}`);
    }
  }

  const vatRate = settings?.vatRate || 22;
  const totalCost = projectData?.costs?.totalCost || 0;
  const vatAmount = totalCost * (vatRate / 100);
  const totalWithVat = totalCost + vatAmount;

  return (
    <div className="card">
      <h2>4. korak: Ponudba / Račun</h2>
      <p>Zaključite projekt z generiranjem ponudbe, pošiljanjem po e-pošti ali shranjevanjem.</p>
      
      <h3>Podatki o stranki</h3>
      <div className="form-group">
        <label htmlFor="clientName">Ime in Priimek / Naziv podjetja:</label>
        <input id="clientName" type="text" value={clientName} onChange={e => setClientName(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="clientAddress">Naslov:</label>
        <textarea id="clientAddress" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
      </div>
       <div className="form-group">
        <label htmlFor="clientEmail">Email (za pošiljanje ponudbe):</label>
        <input id="clientEmail" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="primer@email.com"/>
      </div>
      
      <div className="results-container" style={{backgroundColor: '#fff'}}>
          <h4>Povzetek za ponudbo:</h4>
          {projectData?.costs ? (
            <>
              <p>Strošek materiala: <strong>{projectData.costs.materialCost.toFixed(2)} €</strong></p>
              <p>Strošek dela: <strong>{projectData.costs.laborCost.toFixed(2)} €</strong></p>
              <hr style={{borderTop: '1px solid #eee', margin: '10px 0'}} />
              <p>Skupaj (brez DDV): <strong>{totalCost.toFixed(2)} €</strong></p>
              <p>DDV ({vatRate}%): <strong>{vatAmount.toFixed(2)} €</strong></p>
              <h4 style={{marginTop: '10px'}}>Končna cena z DDV: {totalWithVat.toFixed(2)} €</h4>
            </>
          ) : (
            <p><i>Najprej izpolnite izračun materiala.</i></p>
          )}
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse', marginTop: '20px', gap: '10px'}}>
        <button onClick={() => setStep("montagePlan")} className="btn-secondary">Nazaj</button>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button onClick={handlePrintOrPDF} disabled={!projectData?.costs || loading}>
            {loading ? "Generiram..." : "Natisni / Shrani PDF"}
          </button>
          <button onClick={handleSendEmail} style={{backgroundColor: '#f39c12'}} disabled={!clientEmail}>Pošlji po E-mailu</button>
          <button onClick={handleSaveProject} style={{backgroundColor: '#27ae60'}}>Shrani Projekt</button>
        </div>
      </div>
    </div>
  );
};

export default OfferInvoice;
