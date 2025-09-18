import React, { useState, useEffect } from "react";
import { saveSettings, exportData, importData } from '../utils/dataStorage';
import type { SettingsData } from '../utils/dataStorage';

interface Props {
  setStep: (step: string) => void;
  settings: SettingsData | null;
  setSettings: React.Dispatch<React.SetStateAction<SettingsData | null>>;
}

const Settings: React.FC<Props> = ({ setStep, settings, setSettings }) => {
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyTaxId, setCompanyTaxId] = useState('');
    const [invoiceFooterText, setInvoiceFooterText] = useState('');
    const [vatRate, setVatRate] = useState(22);
    const [logo, setLogo] = useState<string | null>(null);
    const [defaultPrices, setDefaultPrices] = useState({ panel: 50, post: 20, screws: 0.5, concrete: 5, gate: 150 });
    const [defaultLabor, setDefaultLabor] = useState({ hourlyRate: 25 });

    useEffect(() => {
        if (settings) {
            setCompanyName(settings.companyName || '');
            setCompanyAddress(settings.companyAddress || '');
            setCompanyPhone(settings.phone || '');
            setCompanyEmail(settings.email || '');
            setCompanyTaxId(settings.taxID || '');
            setVatRate(settings.vatRate || 22);
            setLogo(settings.logo || null);
            setInvoiceFooterText(settings.invoiceFooterText || '');
            if (settings.defaultPrices) setDefaultPrices(settings.defaultPrices);
            if (settings.defaultLabor) setDefaultLabor(settings.defaultLabor);
        }
    }, [settings]);

    const handleSave = async () => {
        const newSettings = { 
            companyName, 
            companyAddress, 
            phone: companyPhone,
            email: companyEmail,
            taxID: companyTaxId,
            vatRate, 
            logo, 
            invoiceFooterText,
            defaultPrices, 
            defaultLabor 
        };
        try {
            await saveSettings(newSettings);
            setSettings(newSettings);
            alert("Nastavitve so shranjene na strežniku!");
        } catch (error) {
            alert(`Napaka pri shranjevanju nastavitev: ${error}`);
        }
    };

    const handleResetToDefaults = () => {
        if (window.confirm("Ali ste prepričani, da želite ponastaviti podatke podjetja na privzete vrednosti? Spremembe ne bodo shranjene, dokler ne kliknete 'Shrani nastavitve'.")) {
            const defaultSettings = {
                companyName: 'Igor Lozar s.p.',
                companyAddress: 'Cesta 123\n1000 Ljubljana',
                phone: '041 123 456',
                email: 'info@igorlozar.si',
                taxID: 'SI12345678',
                vatRate: 22,
                logo: null,
                invoiceFooterText: 'Rok plačila je 8 dni. V primeru zamude se obračunajo zakonske zamudne obresti.'
            };
            setCompanyName(defaultSettings.companyName);
            setCompanyAddress(defaultSettings.companyAddress);
            setCompanyPhone(defaultSettings.phone);
            setCompanyEmail(defaultSettings.email);
            setCompanyTaxId(defaultSettings.taxID);
            setVatRate(defaultSettings.vatRate);
            setLogo(defaultSettings.logo);
            setInvoiceFooterText(defaultSettings.invoiceFooterText);
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDefaultPrices(prev => ({ ...prev, [name]: parseFloat(value) }));
    }
    const handleLaborChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDefaultLabor(prev => ({ ...prev, [name]: parseFloat(value) }));
    }
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await importData(e.target.files[0]);
                alert("Podatki uspešno uvoženi! Aplikacija se bo osvežila.");
                window.location.reload();
            } catch (error) {
                alert(`Napaka pri uvozu: ${error}`);
            }
        }
    };

    return (
        <div className="card">
            <h2>Nastavitve</h2>
            
            <h3>Podatki o podjetju (za glavo ponudbe/računa)</h3>
            <div className="form-group">
                <label htmlFor="companyName">Naziv podjetja:</label>
                <input id="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="companyAddress">Naslov:</label>
                <textarea id="companyAddress" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="companyPhone">Telefon:</label>
                <input id="companyPhone" type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="companyEmail">Email:</label>
                <input id="companyEmail" type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="companyTaxId">Davčna številka:</label>
                <input id="companyTaxId" type="text" value={companyTaxId} onChange={e => setCompanyTaxId(e.target.value)} />
            </div>
             <div className="form-group">
                <label htmlFor="invoiceFooterText">Opombe/določila na dnu računa (npr. rok plačila):</label>
                <textarea id="invoiceFooterText" value={invoiceFooterText} onChange={e => setInvoiceFooterText(e.target.value)} rows={3} />
            </div>
            <div className="form-group">
                <label htmlFor="vatRate">Stopnja DDV (%):</label>
                <input id="vatRate" type="number" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
                <label htmlFor="logo">Logotip:</label>
                <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
                {logo && <img src={logo} alt="Logo preview" style={{maxWidth: '150px', marginTop: '10px'}} />}
            </div>
            
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
              <button onClick={handleSave}>Shrani nastavitve</button>
              <button onClick={handleResetToDefaults} className="btn-secondary">Ponastavi na privzeto</button>
            </div>

            <hr/>

            <h3>Privzete cene materiala in dela</h3>
            <p>Tukaj nastavite nabavne cene, ki se bodo samodejno uporabile pri novih projektih.</p>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div>
                  <h4>Cene materiala (€/kos)</h4>
                  <div className="form-group">
                      <label>Cena panela:</label>
                      <input type="number" name="panel" value={defaultPrices.panel} onChange={handlePriceChange} />
                  </div>
                  <div className="form-group">
                      <label>Cena stebra:</label>
                      <input type="number" name="post" value={defaultPrices.post} onChange={handlePriceChange} />
                  </div>
                   <div className="form-group">
                      <label>Cena vrat:</label>
                      <input type="number" name="gate" value={defaultPrices.gate} onChange={handlePriceChange} />
                  </div>
              </div>
              <div>
                  <h4>Stroški dela</h4>
                  <div className="form-group">
                      <label>Urna postavka (€):</label>
                      <input type="number" name="hourlyRate" value={defaultLabor.hourlyRate} onChange={handleLaborChange} />
                  </div>
              </div>
            </div>
            
            <hr />

            <h3>Varnostno kopiranje</h3>
            <p>Shranite ali obnovite vse projekte in nastavitve s strežnika.</p>
            <button onClick={exportData} style={{backgroundColor: '#27ae60'}}>Izvozi Podatke (Backup)</button>
            <label htmlFor="import-file" className="button" style={{backgroundColor: '#f39c12', display: 'inline-block', cursor: 'pointer'}}>
                Uvozi Podatke (Restore)
            </label>
            <input type="file" id="import-file" style={{display: 'none'}} accept=".json" onChange={handleImport} />

            <hr />
            <button onClick={() => setStep("home")}>Nazaj</button>
        </div>
    );
};

export default Settings;