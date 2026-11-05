// Zentrale Konfiguration. Änderungen hier (Preise, Maßnahmen, Fitter) per Push auf GitHub ausrollen.
window.CONFIG = {
  version: '0.1.0',
  shop: 'SOS Sport Braunschweig',
  draftDays: 14,

  fitters: ['Thorben'],

  brands: ['Atomic', 'Blizzard', 'Dalbello', 'Dynafit', 'Fischer', 'Full Tilt', 'Head', 'K2', 'Lange',
    'Nordica', 'Rossignol', 'Salomon', 'Scarpa', 'Tecnica'],

  // Markierungen im Fußschema; Formen unterscheiden sich, damit der s/w-Ausdruck lesbar bleibt.
  markerTypes: [
    { id: 'pressure', label: 'Druckstelle', color: '#d32f2f', shape: 'circle' },
    { id: 'pain', label: 'Schmerz', color: '#f57c00', shape: 'triangle' },
    { id: 'redness', label: 'Rötung / Blase', color: '#1976d2', shape: 'square' }
  ],

  photoLabels: ['Fuß von oben', 'Fußseite', 'Fersenansicht', 'Scanner', 'Druckstelle', 'Schuh innen', 'Schuh außen', 'Sonstiges'],

  // kind: paar = keine Auswahl | schuh = Seite | stelle = Seite + Menge | schnalle = Menge
  // price: Euro, wird nur bei extern gekauften Schuhen angezeigt und berechnet.
  measures: [
    { group: 'Schalenanpassung', items: [
      { id: 'thermo-schale', name: 'Thermische Schalenbearbeitung', unit: 'pro Paar', kind: 'paar', price: 100 },
      { id: 'weiten-knoechel', name: 'Weiten am Knöchel', unit: 'pro Stelle', kind: 'stelle', price: 25 },
      { id: 'weiten-vorfuss', name: 'Weiten am Vorfuß', unit: 'pro Stelle', kind: 'stelle', price: 30 },
      { id: 'risterhoehung', name: 'Risterhöhung', unit: 'pro Schuh', kind: 'schuh', price: 25 },
      { id: 'laengen', name: 'Längen', unit: 'pro Schuh', kind: 'schuh', price: 35 },
      { id: 'fraesen', name: 'Fräsen der Schale', unit: 'pro Stelle', kind: 'stelle', price: 30 }
    ] },
    { group: 'Innenschuh', items: [
      { id: 'thermo-innenschuh', name: 'Innenschuhe thermisch verformen', unit: '', kind: 'paar', price: 50 },
      { id: 'fersenkeil', name: 'Fersenkeil einbauen', unit: 'pro Paar', kind: 'paar', price: 15 },
      { id: 'fersenunterbau', name: 'Fersenunterbau unter Einlegesohle', unit: 'pro Paar', kind: 'paar', price: 15 },
      { id: 'reduziersohle', name: 'Reduziersohle einbauen', unit: 'pro Paar', kind: 'paar', price: 12 },
      { id: 'zunge', name: 'Zunge im Radius verändern', unit: '', kind: 'paar', price: 40 }
    ] },
    { group: 'Werkstatt', items: [
      { id: 'sohlenplatten', name: 'Sohlenplatten austauschen', unit: 'pro Paar', kind: 'paar', price: 35 },
      { id: 'schnalle', name: 'Schnallenreparatur', unit: 'pro Schnalle', kind: 'schnalle', price: 35 }
    ] }
  ]
};
