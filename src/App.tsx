import { useState, useMemo, useEffect } from 'react';
import { catalog as defaultCatalog } from './data/catalog';
import type { ServiceItem, Category, Pack } from './data/catalog';

const API_BASE_URL = 'http://localhost:3001/api/data';

const saveDataToServer = async (filename: string, data: unknown) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Network response was not ok');
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
  }
};

const loadDataFromServer = async (filename: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${filename}`);
    if (response.status === 404) return null; // File doesn't exist yet
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
};
import { Check, Info, FileText, ChevronRight, ChevronUp, ChevronDown, Calculator, CheckCircle2, Settings, Plus, Trash2, RotateCcw, Save, Edit3, Eye, FolderOpen, Download, Package, Variable, ArrowUp, ArrowDown, EyeOff, AlignLeft, AlignCenter, AlignJustify, Table, Type, Palette, LayoutTemplate, Type as TypeIcon, Image as ImageIcon } from 'lucide-react';

type SelectedService = {
  item: ServiceItem;
  quantity: number;
  customVariables: Record<string, number>; // Local overrides per client/quote
};

type Modifiers = {
  urgency: boolean;
  successFee: boolean;
  financing: boolean;
  thirdPartyMarkup: boolean;
};

export type QuoteDraft = {
  clientInfo: { name: string; company: string; email: string; date: string };
  selectedServices: Record<string, SelectedService>;
  modifiers: Modifiers;
  quoteCustom: { title: string; introduction: string; footer: string; isEditing: boolean };
  totals: { oneTimeTotal: number; recurringTotal: number; oneTimeBase: number; recurringBase: number; urgencyModifier: number; financingModifier: number; successFeeModifier: number; thirdPartyModifier: number };
  pdfSettings: PdfSettings;
};

export type SavedQuote = {
  id: string;
  date: string;
  clientInfo: { name: string; company: string; email: string; date: string };
  selectedServices: Record<string, SelectedService>;
  modifiers: Modifiers;
  quoteCustom: { title: string; introduction: string; footer: string; isEditing: boolean };
  totals: { oneTimeTotal: number; recurringTotal: number };
  pdfSettings?: PdfSettings; // Optional for backward compatibility with old saves
};

export type PdfSettings = {
  companyName: string;
  companyTagline: string;
  defaultFooter: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  headerLayout: 'left' | 'center' | 'split';
  tableStyle: 'minimal' | 'bordered' | 'striped';
  themeStyle: 'standard' | 'professional' | 'creative';
  sectionHeaders: 'plain' | 'underlined' | 'filled';
  showItemCodes: boolean;
  showCoverPage: boolean;
  defaultTitle: string;
  defaultIntroduction: string;
  layoutBlocks: string[]; // Order of sections: 'cover', 'header', 'client', 'intro', 'title', 'setup', 'retainer', 'totals', 'footer'
  tableColumns: {
    code: boolean;
    name: boolean;
    description: boolean;
    quantity: boolean;
    unitPrice: boolean;
    subtotal: boolean;
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'configure' | 'price' | 'quote' | 'admin' | 'history'>('configure');

  const [isLoading, setIsLoading] = useState(true);

  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [catalog, setCatalog] = useState<Category[]>(defaultCatalog);
  const [packs, setPacks] = useState<Pack[]>([]);

  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedService>>({});
  const [modifiers, setModifiers] = useState<Modifiers>({
    urgency: false,
    successFee: false,
    financing: false,
    thirdPartyMarkup: false,
  });

  const [clientInfo, setClientInfo] = useState({
    name: '',
    company: '',
    email: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    companyName: 'iStudio',
    companyTagline: 'Propuesta de Servicios',
    defaultFooter: 'Este documento es una estimación generada automáticamente por el sistema CPQ de iStudio.\nValores expresados en Pesos Chilenos (CLP). Sujetos a confirmación final.',
    primaryColor: '#2563eb',
    accentColor: '#1d4ed8',
    fontFamily: 'font-inter',
    logoUrl: '',
    headerLayout: 'split',
    tableStyle: 'minimal',
    themeStyle: 'professional',
    sectionHeaders: 'underlined',
    showItemCodes: true,
    showCoverPage: true,
    defaultTitle: 'Alcance del Proyecto (Modelo Híbrido)',
    defaultIntroduction: '',
    layoutBlocks: ['cover', 'header', 'client', 'intro', 'title', 'setup', 'retainer', 'totals', 'footer'],
    tableColumns: {
      code: true,
      name: true,
      description: false,
      quantity: true,
      unitPrice: false,
      subtotal: true
    }
  });

  const [quoteCustom, setQuoteCustom] = useState({
    title: '',
    introduction: '',
    footer: '', // Explicit empty string, default will be populated on render if empty
    isEditing: false
  });

  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [savedQuotesData, catalogData, packsData, pdfSettingsData, quoteDraftData] = await Promise.all([
          loadDataFromServer('cpq-saved-quotes'),
          loadDataFromServer('cpq-catalog'),
          loadDataFromServer('cpq-packs'),
          loadDataFromServer('cpq-pdf-settings'),
          loadDataFromServer('cpq-quote-draft'),
        ]);

        if (savedQuotesData) setSavedQuotes(savedQuotesData);
        if (catalogData) setCatalog(catalogData);
        if (packsData) setPacks(packsData);
        if (pdfSettingsData) setPdfSettings(prev => ({ ...prev, ...pdfSettingsData }));
        if (quoteDraftData) setQuoteDraft(quoteDraftData);

      } catch (e) {
        console.error('Error fetching initial data from server', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const [adminPdfEditing, setAdminPdfEditing] = useState(false);
  const [activePaletteTab, setActivePaletteTab] = useState<'brand' | 'typography' | 'layout' | 'components'>('brand');
  const [adminExpandedSections, setAdminExpandedSections] = useState<Record<string, boolean>>({
    pdf: true,
    packs: true,
  });

  const toggleAdminSection = (sectionId: string) => {
    setAdminExpandedSections(prev => ({
      ...prev,
      [sectionId]: prev[sectionId] !== false ? false : true
    }));
  };

  const collapseAllAdminSections = () => {
    const newState: Record<string, boolean> = { pdf: false, packs: false };
    catalog.forEach(cat => newState[cat.id] = false);
    setAdminExpandedSections(newState);
  };

  const [configureExpandedSections, setConfigureExpandedSections] = useState<Record<string, boolean>>({});

  const toggleConfigureSection = (categoryId: string) => {
    setConfigureExpandedSections(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] !== false ? false : true
    }));
  };

  const collapseAllConfigureSections = () => {
    const newState: Record<string, boolean> = {};
    catalog.forEach(cat => newState[cat.id] = false);
    setConfigureExpandedSections(newState);
  };

  const evaluateItemPrice = (item: ServiceItem, customVars: Record<string, number>): number => {
    if (!item.priceFormula || item.priceFormula.trim() === '' || item.priceFormula === 'basePrice') {
      return item.basePrice;
    }

    try {
      // Safely evaluate simple math formulas replacing variable IDs with values
      let formula = item.priceFormula.toLowerCase();

      // Always allow 'baseprice' variable
      formula = formula.replace(/baseprice/g, item.basePrice.toString());

      if (item.variables) {
        for (const v of item.variables) {
          const val = customVars[v.id] !== undefined ? customVars[v.id] : v.defaultValue;
          // Use regex to match exact variable name boundaries to avoid partial matches
          const regex = new RegExp(`\\b${v.id.toLowerCase()}\\b`, 'g');
          formula = formula.replace(regex, val.toString());
        }
      }

      // Extremely basic and safe math evaluator (only allowing digits, basic operators, and spaces)
      if (/^[0-9+\-*/().\s]+$/.test(formula)) {
        return Math.max(0, new Function('return ' + formula)());
      }

      console.warn(`Invalid formula syntax for item ${item.id}: ${item.priceFormula} (Evaluated: ${formula})`);
      return item.basePrice;
    } catch (e) {
      console.error(`Failed to evaluate formula for item ${item.id}`, e);
      return item.basePrice;
    }
  };

  const handleSelectAllInCategory = (categoryId: string, checked: boolean) => {
    const category = catalog.find(c => c.id === categoryId);
    if (!category) return;

    // items allowed to be selected normally (ignoring global modifiers like A-04)
    const selectableItems = category.items.filter(item => !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id));

    setSelectedServices(prev => {
      const newObj = { ...prev };

      if (checked) {
        // Add all items in category
        selectableItems.forEach(item => {
          if (!newObj[item.id]) {
            const customVars: Record<string, number> = {};
            if (item.variables) {
                item.variables.forEach(v => customVars[v.id] = v.defaultValue);
            }
            newObj[item.id] = { item, quantity: 1, customVariables: customVars };
          }
        });
      } else {
        // Remove all items in category
        selectableItems.forEach(item => {
          delete newObj[item.id];
        });
      }

      return newObj;
    });
  };

  // Toggle selection
  const handleSelectService = (item: ServiceItem) => {
    setSelectedServices(prev => {
      const isSelected = !!prev[item.id];
      if (isSelected) {
        const newObj = { ...prev };
        delete newObj[item.id];
        return newObj;
      } else {
        // Initialize default custom variables if the item uses them
        const customVars: Record<string, number> = {};
        if (item.variables) {
            item.variables.forEach(v => customVars[v.id] = v.defaultValue);
        }

        return {
          ...prev,
          [item.id]: { item, quantity: 1, customVariables: customVars }
        };
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedServices(prev => ({
      ...prev,
      [id]: { ...prev[id], quantity }
    }));
  };

  const handleUpdateCustomVariable = (itemId: string, varId: string, value: number) => {
    setSelectedServices(prev => ({
      ...prev,
      [itemId]: {
          ...prev[itemId],
          customVariables: { ...prev[itemId].customVariables, [varId]: value }
      }
    }));
  };

  const loadPack = (pack: Pack) => {
      if (confirm(`¿Estás seguro de cargar el pack "${pack.name}"? Reemplazará tu selección actual.`)) {
          const newSelected: Record<string, SelectedService> = {};

          pack.items.forEach(pItem => {
              // Find item in catalog
              let foundItem: ServiceItem | undefined;
              catalog.forEach(cat => {
                  const match = cat.items.find(i => i.id === pItem.itemId);
                  if (match) foundItem = match;
              });

              if (foundItem) {
                  // Merge default variables with pack overrides
                  const customVars: Record<string, number> = {};
                  if (foundItem.variables) {
                      foundItem.variables.forEach(v => {
                          customVars[v.id] = pItem.overriddenVariables[v.id] !== undefined ? pItem.overriddenVariables[v.id] : v.defaultValue;
                      });
                  }

                  newSelected[foundItem.id] = { item: foundItem, quantity: 1, customVariables: customVars };
              }
          });

          setSelectedServices(newSelected);
      }
  };

  const calculatePrices = useMemo(() => {
    let oneTimeBase = 0;
    let recurringBase = 0;

    // Filter out modifier items if we want to handle them purely as boolean modifiers
    // For this prototype, if it's selected directly, we'll calculate it
    const services = Object.values(selectedServices);

    services.forEach(({ item, quantity, customVariables }) => {
      // Skip the A-04 to A-07 items as base calculation, we'll apply them via toggles
      if (['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id)) return;

      const itemBaseCost = evaluateItemPrice(item, customVariables);
      const cost = itemBaseCost * quantity;

      if (item.recurring) {
        recurringBase += cost;
      } else {
        oneTimeBase += cost;
      }
    });

    // Extract actual dynamic modifier values from the catalog
    // We try to find them by their default IDs to respect user changes to the basePrice
    const urgencyItem = catalog.find(c => c.id === 'admin')?.items.find(i => i.id === 'A-04');
    const urgencyMultiplier = urgencyItem ? urgencyItem.basePrice : 1.5;

    const financingItem = catalog.find(c => c.id === 'admin')?.items.find(i => i.id === 'A-06');
    const financingPct = financingItem ? financingItem.basePrice : 0.05;

    const successFeeItem = catalog.find(c => c.id === 'admin')?.items.find(i => i.id === 'A-05');
    const successFeePct = successFeeItem ? successFeeItem.basePrice : 0.10;

    const thirdPartyItem = catalog.find(c => c.id === 'admin')?.items.find(i => i.id === 'A-07');
    const thirdPartyPct = thirdPartyItem ? thirdPartyItem.basePrice : 0.15;

    let oneTimeTotal = oneTimeBase;
    const recurringTotal = recurringBase;

    let urgencyModifier = 0;
    let financingModifier = 0;
    let successFeeModifier = 0;
    let thirdPartyModifier = 0;

    // Apply modifiers
    if (modifiers.urgency) {
      urgencyModifier = oneTimeBase * (urgencyMultiplier - 1);
      oneTimeTotal += urgencyModifier;
    }

    if (modifiers.financing) {
      financingModifier = oneTimeTotal * financingPct;
      oneTimeTotal += financingModifier;
    }

    if (modifiers.successFee) {
      successFeeModifier = oneTimeBase * successFeePct;
      oneTimeTotal += successFeeModifier;
    }

    if (modifiers.thirdPartyMarkup) {
      thirdPartyModifier = oneTimeBase * thirdPartyPct;
      oneTimeTotal += thirdPartyModifier;
    }

    return {
      oneTimeBase,
      recurringBase,
      oneTimeTotal,
      recurringTotal,
      urgencyModifier,
      financingModifier,
      successFeeModifier,
      thirdPartyModifier,
    };
  }, [selectedServices, modifiers, catalog]);

  // Only save to server when explicitly requested
  const saveCatalogState = async (newCatalog: Category[]) => {
    await saveDataToServer('cpq-catalog', newCatalog);
  };

  const handleUpdateItem = (categoryId: string, oldItemId: string, updatedItem: ServiceItem) => {
    const newCatalog = catalog.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === oldItemId ? updatedItem : item)
      };
    });
    // Update state, but don't save to localStorage yet
    setCatalog(newCatalog);

    // Update selectedServices if modified item is selected to reflect changes instantly
    setSelectedServices(prev => {
        const newSelected = { ...prev };
        if (newSelected[oldItemId]) {
            const quantity = newSelected[oldItemId].quantity;
            const customVariables = newSelected[oldItemId].customVariables || {};
            delete newSelected[oldItemId];
            newSelected[updatedItem.id] = { item: updatedItem, quantity, customVariables };
        }
        return newSelected;
    });
  };

  const handleAddItem = (categoryId: string) => {
    const newCatalog = catalog.map(cat => {
      if (cat.id !== categoryId) return cat;
      const newItemId = `NEW-${Math.floor(Math.random() * 1000)}`;
      return {
        ...cat,
        items: [...cat.items, { id: newItemId, name: 'Nuevo Item', description: '', basePrice: 0, unit: 'global', recurring: false }]
      };
    });
    setCatalog(newCatalog);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const newCatalog = catalog.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
            ...cat,
            items: cat.items.filter(item => item.id !== itemId)
        };
    });
    setCatalog(newCatalog);

    if (selectedServices[itemId]) {
        const newSelected = {...selectedServices};
        delete newSelected[itemId];
        setSelectedServices(newSelected);
    }
  };

  const handleGenerateFinalDocument = async () => {
      const newDraft: QuoteDraft = {
          clientInfo: { ...clientInfo },
          selectedServices: { ...selectedServices },
          modifiers: { ...modifiers },
          totals: { ...calculatePrices },
          pdfSettings: { ...pdfSettings },
          // Mantener los textos customizados si ya existía un draft, si no, crear vacío
          quoteCustom: quoteDraft ? { ...quoteDraft.quoteCustom } : { title: '', introduction: '', footer: '', isEditing: false }
      };

      setQuoteDraft(newDraft);
      await saveDataToServer('cpq-quote-draft', newDraft);
  };

  const handleSaveCategory = async () => {
      await saveCatalogState(catalog);
      // Optional: Show some success feedback
      alert('Cambios del catálogo guardados exitosamente en el servidor.');
  };

  const handleSavePacks = async () => {
      await saveDataToServer('cpq-packs', packs);
      alert('Packs guardados exitosamente en el servidor.');
  };

  const handleCreatePack = () => {
      const newPack: Pack = {
          id: `PACK-${Math.floor(Math.random() * 10000)}`,
          name: 'Nuevo Pack',
          description: '',
          items: []
      };
      setPacks([newPack, ...packs]);
  };

  const handleUpdatePack = (updatedPack: Pack) => {
      setPacks(packs.map(p => p.id === updatedPack.id ? updatedPack : p));
  };

  const handleDeletePack = (packId: string) => {
      if (confirm('¿Estás seguro de eliminar este Pack?')) {
          setPacks(packs.filter(p => p.id !== packId));
      }
  };

  const getCatalogItem = (itemId: string): ServiceItem | undefined => {
      for (const cat of catalog) {
          const found = cat.items.find(i => i.id === itemId);
          if (found) return found;
      }
      return undefined;
  };

  const handleSavePdfSettings = async () => {
      await saveDataToServer('cpq-pdf-settings', pdfSettings);
      alert('Configuración de PDF guardada exitosamente en el servidor.');
  };

  const handleResetCatalog = async () => {
      if (confirm('¿Estás seguro de restaurar el catálogo a sus valores por defecto? Perderás todos los cambios.')) {
          setCatalog(defaultCatalog);
          await saveDataToServer('cpq-catalog', defaultCatalog);
          setSelectedServices({});
      }
  };

  const handleSaveAndPrint = async () => {
    if (!quoteDraft) {
        alert("Primero debes generar el documento final.");
        return;
    }

    // Generate a unique ID based on date and time
    const quoteId = `QT-${Date.now().toString(36).toUpperCase()}`;

    const newQuote: SavedQuote = {
      id: quoteId,
      date: new Date().toISOString(),
      clientInfo: { ...quoteDraft.clientInfo },
      selectedServices: { ...quoteDraft.selectedServices },
      modifiers: { ...quoteDraft.modifiers },
      quoteCustom: { ...quoteDraft.quoteCustom, isEditing: false }, // don't save editing state
      totals: {
        oneTimeTotal: quoteDraft.totals.oneTimeTotal,
        recurringTotal: quoteDraft.totals.recurringTotal
      },
      pdfSettings: { ...quoteDraft.pdfSettings }
    };

    const newSavedQuotes = [newQuote, ...savedQuotes];
    setSavedQuotes(newSavedQuotes);
    await saveDataToServer('cpq-saved-quotes', newSavedQuotes);

    // Close edit mode if it was open to ensure it prints clean
    if (quoteDraft.quoteCustom.isEditing) {
      const updatedDraft = { ...quoteDraft, quoteCustom: { ...quoteDraft.quoteCustom, isEditing: false } };
      setQuoteDraft(updatedDraft);
      await saveDataToServer('cpq-quote-draft', updatedDraft);
      // Give React a tick to update the DOM before printing
      setTimeout(() => window.print(), 100);
    } else {
      window.print();
    }
  };

  const loadSavedQuote = async (quote: SavedQuote) => {
    if (confirm('¿Estás seguro de cargar este presupuesto? Perderás el trabajo actual no guardado en el borrador de Quote.')) {
      // Set the live configuration state to match the loaded quote
      setClientInfo(quote.clientInfo);
      setSelectedServices(quote.selectedServices);
      setModifiers(quote.modifiers);

      // We do NOT override the global pdfSettings (Admin), but we DO create a new QuoteDraft from the saved quote.
      const newDraft: QuoteDraft = {
          clientInfo: { ...quote.clientInfo },
          selectedServices: { ...quote.selectedServices },
          modifiers: { ...quote.modifiers },
          quoteCustom: { ...quote.quoteCustom, isEditing: false },
          totals: {
              oneTimeTotal: quote.totals.oneTimeTotal,
              recurringTotal: quote.totals.recurringTotal,
              oneTimeBase: 0, recurringBase: 0, urgencyModifier: 0, financingModifier: 0, successFeeModifier: 0, thirdPartyModifier: 0 // Mock legacy totals if needed
          },
          pdfSettings: quote.pdfSettings || pdfSettings
      };

      setQuoteDraft(newDraft);
      await saveDataToServer('cpq-quote-draft', newDraft);

      setActiveTab('quote');
    }
  };

  const deleteSavedQuote = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro del historial?')) {
      const updatedQuotes = savedQuotes.filter(q => q.id !== id);
      setSavedQuotes(updatedQuotes);
      await saveDataToServer('cpq-saved-quotes', updatedQuotes);
    }
  };

  const quotesByClient = useMemo(() => {
    const groups: Record<string, SavedQuote[]> = {};
    savedQuotes.forEach(quote => {
      const clientName = quote.clientInfo.name || 'Sin Cliente Especificado';
      if (!groups[clientName]) groups[clientName] = [];
      groups[clientName].push(quote);
    });
    return groups;
  }, [savedQuotes]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const moveLayoutBlock = (index: number, direction: -1 | 1) => {
      const newLayout = [...pdfSettings.layoutBlocks];
      if (index + direction < 0 || index + direction >= newLayout.length) return;
      const temp = newLayout[index];
      newLayout[index] = newLayout[index + direction];
      newLayout[index + direction] = temp;
      setPdfSettings({...pdfSettings, layoutBlocks: newLayout});
  };

  const toggleBlockVisibility = (block: string) => {
      const isVisible = pdfSettings.layoutBlocks.includes(block);
      let newLayout = [...pdfSettings.layoutBlocks];
      if (isVisible) {
          newLayout = newLayout.filter(b => b !== block);
      } else {
          newLayout.push(block);
      }
      setPdfSettings({...pdfSettings, layoutBlocks: newLayout});
  };

  const renderPdfDocument = (mode: 'admin' | 'quote') => {
      if (mode === 'quote' && !quoteDraft) {
          return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay un documento generado</h3>
                  <p className="text-sm max-w-md mx-auto">
                      Haz clic en el botón "Generar documento Final (Q)" en la parte superior para crear tu propuesta basándote en la configuración actual.
                  </p>
              </div>
          );
      }

      const isGlobalEditing = mode === 'admin';
      const isLocalEditing = mode === 'quote' && quoteDraft?.quoteCustom?.isEditing;
      const isEditing = isGlobalEditing || isLocalEditing;

      // Extract variables based on mode
      const activeSettings = mode === 'admin' ? pdfSettings : quoteDraft!.pdfSettings;
      const activeClientInfo = mode === 'admin' ? clientInfo : quoteDraft!.clientInfo;
      const activeServicesObj = mode === 'admin' ? selectedServices : quoteDraft!.selectedServices;
      const activeTotals = mode === 'admin' ? calculatePrices : quoteDraft!.totals;

      const titleVal = isGlobalEditing ? activeSettings.defaultTitle : (quoteDraft!.quoteCustom.title || activeSettings.defaultTitle);
      const introVal = isGlobalEditing ? activeSettings.defaultIntroduction : (quoteDraft!.quoteCustom.introduction || activeSettings.defaultIntroduction);
      const footerVal = isGlobalEditing ? activeSettings.defaultFooter : (quoteDraft!.quoteCustom.footer || activeSettings.defaultFooter);

      const updateDraftCustom = (key: 'title' | 'introduction' | 'footer', value: string) => {
          if (mode !== 'quote' || !quoteDraft) return;
          const updatedDraft = {
              ...quoteDraft,
              quoteCustom: { ...quoteDraft.quoteCustom, [key]: value }
          };
          setQuoteDraft(updatedDraft);
          saveDataToServer('cpq-quote-draft', updatedDraft);
      };

      const renderBlockToolbar = (block: string, index: number) => {
          if (!isGlobalEditing) return null;
          return (
              <div className="absolute -top-3 -right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white shadow-md border border-gray-200 rounded px-1 py-1 print:hidden items-center">
                  {block === 'header' && (
                      <>
                          <button onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'left'})} className={`p-1 rounded ${pdfSettings.headerLayout === 'left' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`} title="Alinear Izquierda"><AlignLeft className="w-3 h-3" /></button>
                          <button onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'center'})} className={`p-1 rounded ${pdfSettings.headerLayout === 'center' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`} title="Centrar"><AlignCenter className="w-3 h-3" /></button>
                          <button onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'split'})} className={`p-1 rounded ${pdfSettings.headerLayout === 'split' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`} title="Dividir L/R"><AlignJustify className="w-3 h-3" /></button>
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      </>
                  )}
                  {(block === 'setup' || block === 'retainer') && (
                      <>
                          <button onClick={() => {
                              const nextStyle = pdfSettings.tableStyle === 'minimal' ? 'bordered' : pdfSettings.tableStyle === 'bordered' ? 'striped' : 'minimal';
                              setPdfSettings({...pdfSettings, tableStyle: nextStyle});
                          }} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Estilo Tabla"><Table className="w-3 h-3" /></button>
                          <button onClick={() => {
                              const nextHeader = pdfSettings.sectionHeaders === 'plain' ? 'underlined' : pdfSettings.sectionHeaders === 'underlined' ? 'filled' : 'plain';
                              setPdfSettings({...pdfSettings, sectionHeaders: nextHeader});
                          }} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Estilo Encabezado"><Type className="w-3 h-3" /></button>
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      </>
                  )}
                  <button onClick={() => moveLayoutBlock(index, -1)} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => moveLayoutBlock(index, 1)} disabled={index === pdfSettings.layoutBlocks.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                  <button onClick={() => toggleBlockVisibility(block)} className="p-1 hover:bg-red-50 rounded text-red-500"><EyeOff className="w-3 h-3" /></button>
              </div>
          );
      };

      const renderBlock = (block: string, index: number) => {
          return (
              <div key={block} className={`relative group ${isGlobalEditing ? 'hover:ring-2 ring-blue-300 ring-offset-4 rounded transition-all' : ''}`}>
                  {renderBlockToolbar(block, index)}

                  {block === 'cover' && pdfSettings.showCoverPage && (
                      <div className="flex flex-col justify-center items-center min-h-[100vh] print:break-after-page text-center px-20">
                          {pdfSettings.logoUrl && <img src={pdfSettings.logoUrl} alt="Logo" className="max-h-32 mb-12" />}
                          {isGlobalEditing ? (
                              <input
                                  value={pdfSettings.defaultTitle}
                                  onChange={e => setPdfSettings({...pdfSettings, defaultTitle: e.target.value})}
                                  className="w-full text-center text-6xl font-black text-gray-900 tracking-tight mb-4 bg-transparent border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none"
                              />
                          ) : (
                              <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-4">{titleVal}</h1>
                          )}
                          <h2 className="text-2xl font-medium mb-16" style={{ color: pdfSettings.primaryColor }}>
                              {isGlobalEditing ? (
                                  <>
                                      <input value={pdfSettings.companyName} onChange={e => setPdfSettings({...pdfSettings, companyName: e.target.value})} className="bg-transparent w-auto text-right border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none" style={{ color: pdfSettings.primaryColor }} />
                                      {" - "}
                                      <input value={pdfSettings.companyTagline} onChange={e => setPdfSettings({...pdfSettings, companyTagline: e.target.value})} className="bg-transparent w-auto text-left border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none" style={{ color: pdfSettings.primaryColor }} />
                                  </>
                              ) : (
                                  `${pdfSettings.companyName} - ${pdfSettings.companyTagline}`
                              )}
                          </h2>

                          <div className="mt-20 border-t-2 pt-12 w-full max-w-md" style={{ borderColor: pdfSettings.accentColor }}>
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Preparado para</p>
                              <p className="text-2xl font-bold text-gray-900">{isGlobalEditing ? '[Nombre Cliente]' : (clientInfo.name || 'Cliente')}</p>
                              <p className="text-xl text-gray-600 mt-1">{isGlobalEditing ? '[Empresa]' : clientInfo.company}</p>
                              <p className="text-gray-500 mt-8">Fecha: {new Date(clientInfo.date).toLocaleDateString('es-CL')}</p>
                          </div>
                      </div>
                  )}

                  {block === 'header' && (
                      <div
                        className={`border-b-2 pb-6 mb-8 ${pdfSettings.headerLayout === 'center' ? 'flex flex-col items-center text-center' : pdfSettings.headerLayout === 'left' ? 'flex flex-col items-start' : 'flex justify-between items-end'} ${pdfSettings.showCoverPage ? 'print:pt-10' : ''}`}
                        style={{ borderColor: pdfSettings.primaryColor }}
                      >
                          <div className={`${pdfSettings.headerLayout === 'center' ? 'mb-4' : pdfSettings.headerLayout === 'left' ? 'mb-4 w-full flex justify-between items-start' : 'flex items-center'}`}>
                              {pdfSettings.headerLayout === 'left' ? (
                                  <>
                                      <div>
                                          {pdfSettings.logoUrl && <img src={pdfSettings.logoUrl} alt="Logo" className="max-h-16 mb-2" />}
                                          {isGlobalEditing ? (
                                              <>
                                                  <input value={pdfSettings.companyName} onChange={e => setPdfSettings({...pdfSettings, companyName: e.target.value})} className="block text-3xl font-black text-gray-900 tracking-tight bg-transparent border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none" />
                                                  <input value={pdfSettings.companyTagline} onChange={e => setPdfSettings({...pdfSettings, companyTagline: e.target.value})} className="block font-semibold tracking-wide bg-transparent border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none" style={{ color: pdfSettings.primaryColor }} />
                                              </>
                                          ) : (
                                              <>
                                                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{pdfSettings.companyName}</h1>
                                                  <p className="font-semibold tracking-wide" style={{ color: pdfSettings.primaryColor }}>{pdfSettings.companyTagline}</p>
                                              </>
                                          )}
                                      </div>
                                      <div className="text-right text-sm text-gray-500">
                                          {isEditing ? (
                                              <div className="flex items-center justify-end space-x-2 mb-1 print:hidden">
                                                  <span className="font-medium text-gray-400">Fecha:</span>
                                                  <p className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 text-gray-600 cursor-not-allowed">{activeClientInfo.date}</p>
                                              </div>
                                          ) : (
                                              <p>Fecha: {new Date(activeClientInfo.date).toLocaleDateString('es-CL')}</p>
                                          )}
                                          <p>Cotización Nº: {activeClientInfo.date.replace(/-/g, '').slice(2)}01</p>
                                      </div>
                                  </>
                              ) : (
                                  <>
                                      {activeSettings.logoUrl && <img src={activeSettings.logoUrl} alt="Logo" className={`max-h-16 ${activeSettings.headerLayout === 'center' ? 'mb-4' : 'mr-4'}`} />}
                                      <div>
                                          {isGlobalEditing ? (
                                              <>
                                                  <input value={activeSettings.companyName} onChange={e => setPdfSettings({...pdfSettings, companyName: e.target.value})} className={`block text-3xl font-black text-gray-900 tracking-tight bg-transparent border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none ${activeSettings.headerLayout === 'center' ? 'text-center mx-auto' : ''}`} />
                                                  <input value={activeSettings.companyTagline} onChange={e => setPdfSettings({...pdfSettings, companyTagline: e.target.value})} className={`block font-semibold tracking-wide bg-transparent border-b border-dashed border-gray-300 hover:border-indigo-400 focus:outline-none ${activeSettings.headerLayout === 'center' ? 'text-center mx-auto' : ''}`} style={{ color: activeSettings.primaryColor }} />
                                              </>
                                          ) : (
                                              <>
                                                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{activeSettings.companyName}</h1>
                                                  <p className="font-semibold tracking-wide" style={{ color: activeSettings.primaryColor }}>{activeSettings.companyTagline}</p>
                                              </>
                                          )}
                                      </div>
                                  </>
                              )}
                          </div>

                          {activeSettings.headerLayout !== 'left' && (
                              <div className={`text-sm text-gray-500 ${activeSettings.headerLayout === 'center' ? 'text-center' : 'text-right'}`}>
                                  {isEditing ? (
                                      <div className={`flex items-center space-x-2 mb-1 print:hidden ${activeSettings.headerLayout === 'center' ? 'justify-center' : 'justify-end'}`}>
                                          <span className="font-medium text-gray-400">Fecha:</span>
                                          <p className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 text-gray-600 cursor-not-allowed">{activeClientInfo.date}</p>
                                      </div>
                                  ) : (
                                      <p>Fecha: {new Date(activeClientInfo.date).toLocaleDateString('es-CL')}</p>
                                  )}
                                  <p>Cotización Nº: {activeClientInfo.date.replace(/-/g, '').slice(2)}01</p>
                              </div>
                          )}
                      </div>
                  )}

                  {block === 'client' && (isGlobalEditing || activeClientInfo.name || activeClientInfo.company || isEditing) && (
                      <div className={`mb-8 ${activeSettings.showCoverPage ? 'print:hidden' : ''}`}>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preparado para</h3>
                          {isEditing ? (
                              <div className="space-y-1 max-w-md print:hidden">
                                  <input
                                      type="text"
                                      placeholder="Nombre del cliente o Empresa"
                                      value={isGlobalEditing ? '[Nombre Cliente]' : activeClientInfo.name}
                                      onChange={e => {
                                          if (!isGlobalEditing && mode === 'quote' && quoteDraft) {
                                              const newDraft = {...quoteDraft, clientInfo: {...quoteDraft.clientInfo, name: e.target.value}};
                                              setQuoteDraft(newDraft);
                                              saveDataToServer('cpq-quote-draft', newDraft);
                                          }
                                      }}
                                      className="w-full border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded px-2 py-1 text-lg font-semibold text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                      readOnly={isGlobalEditing}
                                  />
                                  <input
                                      type="text"
                                      placeholder="Empresa o Cargo (opcional)"
                                      value={isGlobalEditing ? '[Empresa]' : activeClientInfo.company}
                                      onChange={e => {
                                          if (!isGlobalEditing && mode === 'quote' && quoteDraft) {
                                              const newDraft = {...quoteDraft, clientInfo: {...quoteDraft.clientInfo, company: e.target.value}};
                                              setQuoteDraft(newDraft);
                                              saveDataToServer('cpq-quote-draft', newDraft);
                                          }
                                      }}
                                      className="w-full border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded px-2 py-1 text-gray-600 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                      readOnly={isGlobalEditing}
                                  />
                              </div>
                          ) : (
                              <>
                                  <p className="font-semibold text-gray-900 text-lg">{activeClientInfo.name || 'Cliente'}</p>
                                  {activeClientInfo.company && <p className="text-gray-600">{activeClientInfo.company}</p>}
                              </>
                          )}
                      </div>
                  )}

                  {block === 'intro' && (isGlobalEditing || introVal || isEditing) && (
                      <div className="mb-8">
                          {isEditing ? (
                              <textarea
                                  placeholder="Haz clic aquí para escribir un párrafo introductorio..."
                                  value={introVal}
                                  onChange={e => isGlobalEditing ? setPdfSettings({...pdfSettings, defaultIntroduction: e.target.value}) : updateDraftCustom('introduction', e.target.value)}
                                  className={`w-full border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded p-2 text-gray-600 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px] resize-y transition-colors print:hidden ${isGlobalEditing ? 'bg-blue-50' : ''}`}
                              />
                          ) : (
                              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{introVal}</p>
                          )}
                      </div>
                  )}

                  {block === 'title' && (
                      <div className={`mb-4 pb-2 ${pdfSettings.showCoverPage ? 'print:hidden' : ''}`}>
                          {isEditing ? (
                              <input
                                  type="text"
                                  value={titleVal}
                                  onChange={e => isGlobalEditing ? setPdfSettings({...pdfSettings, defaultTitle: e.target.value}) : setQuoteCustom({...quoteCustom, title: e.target.value})}
                                  className={`w-full text-xl font-bold text-gray-800 border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded px-2 py-1 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors print:hidden ${isGlobalEditing ? 'bg-blue-50' : ''}`}
                              />
                          ) : (
                              <h2 className="text-xl font-bold text-gray-800">{titleVal}</h2>
                          )}
                      </div>
                  )}

                  {block === 'setup' && (
                      <div className="mb-6">
                          <h3 className={`font-semibold mb-3 ${activeSettings.sectionHeaders === 'filled' ? 'p-2 rounded text-white' : activeSettings.sectionHeaders === 'underlined' ? 'border-b-2 pb-1 text-gray-800' : 'text-gray-800'}`} style={activeSettings.sectionHeaders === 'filled' ? { backgroundColor: activeSettings.primaryColor } : activeSettings.sectionHeaders === 'underlined' ? { borderColor: activeSettings.primaryColor } : { color: activeSettings.primaryColor }}>
                              1. Servicios de Setup (Pago Único)
                          </h3>
                          <table className={`w-full text-sm text-left ${activeSettings.tableStyle === 'bordered' ? 'border border-gray-200' : ''}`}>
                              <thead>
                                  <tr className={`border-b text-gray-500 ${activeSettings.tableStyle === 'bordered' ? 'bg-gray-50' : ''}`} style={{ borderColor: activeSettings.tableStyle !== 'bordered' ? activeSettings.primaryColor : '#e5e7eb' }}>
                                      {(activeSettings.tableColumns.code || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, code: !pdfSettings.tableColumns.code}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.code && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Código</th>}
                                      {(activeSettings.tableColumns.name || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, name: !pdfSettings.tableColumns.name}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.name && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Descripción</th>}
                                      {(activeSettings.tableColumns.description || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, description: !pdfSettings.tableColumns.description}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.description && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Detalle</th>}
                                      {(activeSettings.tableColumns.quantity || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, quantity: !pdfSettings.tableColumns.quantity}})} className={`py-2 px-2 font-medium text-center ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.quantity && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Cant.</th>}
                                      {(activeSettings.tableColumns.unitPrice || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, unitPrice: !pdfSettings.tableColumns.unitPrice}})} className={`py-2 px-2 font-medium text-right ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.unitPrice && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>P. Unitario</th>}
                                      {(activeSettings.tableColumns.subtotal || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, subtotal: !pdfSettings.tableColumns.subtotal}})} className={`py-2 px-2 font-medium text-right ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.subtotal && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Subtotal</th>}
                                  </tr>
                              </thead>
                              <tbody className={activeSettings.tableStyle === 'minimal' ? 'divide-y divide-gray-100' : ''}>
                                  {Object.values(activeServicesObj).filter(({item}) => !item.recurring && !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id)).length === 0 ? (
                                      <tr><td colSpan={6} className="py-4 text-center text-gray-400 italic">No hay servicios únicos seleccionados</td></tr>
                                  ) : (
                                      Object.values(activeServicesObj)
                                          .filter(({item}) => !item.recurring && !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id))
                                          .map(({item, quantity, customVariables}, idx) => {
                                              const price = evaluateItemPrice(item, customVariables);
                                              return (
                                                  <tr key={item.id} className={`${activeSettings.tableStyle === 'striped' && idx % 2 === 0 ? 'bg-gray-50' : ''} ${activeSettings.tableStyle === 'bordered' ? 'border-b border-gray-200' : ''}`}>
                                                      {(activeSettings.tableColumns.code || isGlobalEditing) && <td className={`py-3 px-2 font-mono text-xs text-gray-500 ${!activeSettings.tableColumns.code && isGlobalEditing ? 'opacity-30' : ''}`}>{item.id}</td>}
                                                      {(activeSettings.tableColumns.name || isGlobalEditing) && <td className={`py-3 px-2 font-medium text-gray-900 ${!activeSettings.tableColumns.name && isGlobalEditing ? 'opacity-30' : ''}`}>{item.name}</td>}
                                                      {(activeSettings.tableColumns.description || isGlobalEditing) && <td className={`py-3 px-2 text-xs text-gray-500 max-w-xs ${!activeSettings.tableColumns.description && isGlobalEditing ? 'opacity-30' : ''}`}>{item.description}</td>}
                                                      {(activeSettings.tableColumns.quantity || isGlobalEditing) && <td className={`py-3 px-2 text-center text-gray-600 ${!activeSettings.tableColumns.quantity && isGlobalEditing ? 'opacity-30' : ''}`}>{quantity}</td>}
                                                      {(activeSettings.tableColumns.unitPrice || isGlobalEditing) && <td className={`py-3 px-2 text-right text-gray-600 ${!activeSettings.tableColumns.unitPrice && isGlobalEditing ? 'opacity-30' : ''}`}>{formatCurrency(price)}</td>}
                                                      {(activeSettings.tableColumns.subtotal || isGlobalEditing) && <td className={`py-3 px-2 text-right text-gray-900 font-medium ${!activeSettings.tableColumns.subtotal && isGlobalEditing ? 'opacity-30' : ''}`}>{formatCurrency(price * quantity)}</td>}
                                                  </tr>
                                              );
                                          })
                                  )}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {block === 'retainer' && Object.values(activeServicesObj).some(({item}) => item.recurring) && (
                      <div className="mt-8 mb-6">
                          <h3 className={`font-semibold mb-3 ${activeSettings.sectionHeaders === 'filled' ? 'p-2 rounded text-white' : activeSettings.sectionHeaders === 'underlined' ? 'border-b-2 pb-1 text-gray-800' : 'text-gray-800'}`} style={activeSettings.sectionHeaders === 'filled' ? { backgroundColor: activeSettings.primaryColor } : activeSettings.sectionHeaders === 'underlined' ? { borderColor: activeSettings.primaryColor } : { color: activeSettings.primaryColor }}>
                              2. Servicios Retainer (Mensual)
                          </h3>
                          <table className={`w-full text-sm text-left ${activeSettings.tableStyle === 'bordered' ? 'border border-gray-200' : ''}`}>
                              <thead>
                                  <tr className={`border-b text-gray-500 ${activeSettings.tableStyle === 'bordered' ? 'bg-gray-50' : ''}`} style={{ borderColor: activeSettings.tableStyle !== 'bordered' ? activeSettings.primaryColor : '#e5e7eb' }}>
                                      {(activeSettings.tableColumns.code || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, code: !pdfSettings.tableColumns.code}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.code && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Código</th>}
                                      {(activeSettings.tableColumns.name || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, name: !pdfSettings.tableColumns.name}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.name && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Descripción</th>}
                                      {(activeSettings.tableColumns.description || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, description: !pdfSettings.tableColumns.description}})} className={`py-2 px-2 font-medium ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.description && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Detalle</th>}
                                      {(activeSettings.tableColumns.quantity || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, quantity: !pdfSettings.tableColumns.quantity}})} className={`py-2 px-2 font-medium text-center ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.quantity && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Cant.</th>}
                                      {(activeSettings.tableColumns.unitPrice || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, unitPrice: !pdfSettings.tableColumns.unitPrice}})} className={`py-2 px-2 font-medium text-right ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.unitPrice && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>P. Unitario</th>}
                                      {(activeSettings.tableColumns.subtotal || isGlobalEditing) && <th onClick={() => isGlobalEditing && setPdfSettings({...pdfSettings, tableColumns: {...pdfSettings.tableColumns, subtotal: !pdfSettings.tableColumns.subtotal}})} className={`py-2 px-2 font-medium text-right ${isGlobalEditing ? 'cursor-pointer hover:bg-gray-100' : ''} ${!activeSettings.tableColumns.subtotal && isGlobalEditing ? 'opacity-30 line-through' : ''}`}>Valor Mensual</th>}
                                  </tr>
                              </thead>
                              <tbody className={activeSettings.tableStyle === 'minimal' ? 'divide-y divide-gray-100' : ''}>
                                  {Object.values(activeServicesObj)
                                      .filter(({item}) => item.recurring)
                                      .map(({item, quantity, customVariables}, idx) => {
                                          const price = evaluateItemPrice(item, customVariables);
                                          return (
                                              <tr key={item.id} className={`${activeSettings.tableStyle === 'striped' && idx % 2 === 0 ? 'bg-gray-50' : ''} ${activeSettings.tableStyle === 'bordered' ? 'border-b border-gray-200' : ''}`}>
                                                  {(activeSettings.tableColumns.code || isGlobalEditing) && <td className={`py-3 px-2 font-mono text-xs text-gray-500 ${!activeSettings.tableColumns.code && isGlobalEditing ? 'opacity-30' : ''}`}>{item.id}</td>}
                                                  {(activeSettings.tableColumns.name || isGlobalEditing) && <td className={`py-3 px-2 font-medium text-gray-900 ${!activeSettings.tableColumns.name && isGlobalEditing ? 'opacity-30' : ''}`}>{item.name}</td>}
                                                  {(activeSettings.tableColumns.description || isGlobalEditing) && <td className={`py-3 px-2 text-xs text-gray-500 max-w-xs ${!activeSettings.tableColumns.description && isGlobalEditing ? 'opacity-30' : ''}`}>{item.description}</td>}
                                                  {(activeSettings.tableColumns.quantity || isGlobalEditing) && <td className={`py-3 px-2 text-center text-gray-600 ${!activeSettings.tableColumns.quantity && isGlobalEditing ? 'opacity-30' : ''}`}>{quantity}</td>}
                                                  {(activeSettings.tableColumns.unitPrice || isGlobalEditing) && <td className={`py-3 px-2 text-right text-gray-600 ${!activeSettings.tableColumns.unitPrice && isGlobalEditing ? 'opacity-30' : ''}`}>{formatCurrency(price)}</td>}
                                                  {(activeSettings.tableColumns.subtotal || isGlobalEditing) && <td className={`py-3 px-2 text-right text-gray-900 font-medium ${!activeSettings.tableColumns.subtotal && isGlobalEditing ? 'opacity-30' : ''}`}>{formatCurrency(price * quantity)}</td>}
                                              </tr>
                                          );
                                      })}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {block === 'totals' && (
                      <div className="mt-12 p-8 rounded-xl print:break-inside-avoid" style={{ backgroundColor: activeSettings.themeStyle === 'creative' ? activeSettings.accentColor + '10' : '#f9fafb', border: `1px solid ${activeSettings.themeStyle === 'professional' ? activeSettings.accentColor : '#e5e7eb'}` }}>
                          <h3 className="font-bold text-gray-800 mb-6 uppercase tracking-wider" style={{ color: activeSettings.themeStyle === 'professional' ? activeSettings.accentColor : '' }}>
                              Resumen de Inversión
                          </h3>
                          <div className="space-y-3 mb-6 pb-6 border-b" style={{ borderColor: activeSettings.themeStyle === 'professional' ? activeSettings.accentColor + '30' : '#e5e7eb' }}>
                              <div className="flex justify-between text-sm font-medium text-gray-600">
                                  <span>Subtotal Setup de Proyecto</span>
                                  <span>{formatCurrency(activeTotals.oneTimeBase)}</span>
                              </div>
                              {modifiers.urgency && (
                                  <div className="flex justify-between text-sm text-gray-500">
                                      <span>Recargo por Urgencia</span>
                                      <span>{formatCurrency(activeTotals.urgencyModifier)}</span>
                                  </div>
                              )}
                              {modifiers.financing && (
                                  <div className="flex justify-between text-sm text-gray-500">
                                      <span>Recargo por Financiamiento</span>
                                      <span>{formatCurrency(activeTotals.financingModifier)}</span>
                                  </div>
                              )}
                              {modifiers.successFee && (
                                  <div className="flex justify-between text-sm text-gray-500">
                                      <span>Tasa de Riesgo/Éxito (Startups)</span>
                                      <span>{formatCurrency(activeTotals.successFeeModifier)}</span>
                                  </div>
                              )}
                              {modifiers.thirdPartyMarkup && (
                                  <div className="flex justify-between text-sm text-gray-500">
                                      <span>Markup de Terceros</span>
                                      <span>{formatCurrency(activeTotals.thirdPartyModifier)}</span>
                                  </div>
                              )}
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                              <div className="flex-1 w-full">
                                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Inversión Inicial Única</p>
                                  <p className="text-4xl font-black text-gray-900">{formatCurrency(activeTotals.oneTimeTotal)}</p>
                              </div>
                              {activeTotals.recurringTotal > 0 && (
                                  <div className="flex-1 w-full md:text-right">
                                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Inversión Mensual (Retainer)</p>
                                      <p className="text-3xl font-black" style={{ color: activeSettings.primaryColor }}>{formatCurrency(activeTotals.recurringTotal)}<span className="text-lg font-medium text-gray-500">/mes</span></p>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {block === 'footer' && (
                      <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
                          {isEditing ? (
                              <textarea
                                  value={footerVal}
                                  onChange={e => isGlobalEditing ? setPdfSettings({...pdfSettings, defaultFooter: e.target.value}) : updateDraftCustom('footer', e.target.value)}
                                  className={`w-full border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded p-2 text-gray-500 text-center focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px] resize-y transition-colors print:hidden ${isGlobalEditing ? 'bg-blue-50' : ''}`}
                              />
                          ) : (
                              <p className="whitespace-pre-wrap">{footerVal}</p>
                          )}
                      </div>
                  )}
              </div>
          );
      };

      return (
          <div className={`bg-white shadow-lg border border-gray-200 mx-auto max-w-4xl p-10 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full print:m-0 ${activeSettings.fontFamily} ${activeSettings.themeStyle === 'creative' ? 'rounded-2xl' : ''} ${isLocalEditing ? 'ring-4 ring-blue-100 relative' : ''} ${isGlobalEditing ? 'min-h-[800px]' : ''}`}>
              {isLocalEditing && (
                  <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 print:hidden">
                      MODO EDICIÓN VISUAL
                  </div>
              )}
              {isGlobalEditing && (
                  <div className="absolute -top-4 -right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 print:hidden">
                      EDITOR ESTRUCTURAL DE PLANTILLA
                  </div>
              )}
              {activeSettings.layoutBlocks.map((block, index) => renderBlock(block, index))}
          </div>
      );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Conectando con el servidor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans print:bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-blue-600 tracking-tight">iStudio CPQ</span>
            </div>

            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('configure')}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${activeTab === 'configure' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                1. Configure (C)
              </button>
              <button
                onClick={() => setActiveTab('price')}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${activeTab === 'price' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Calculator className="w-4 h-4 mr-2" />
                2. Price (P)
              </button>
              <button
                onClick={() => setActiveTab('quote')}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${activeTab === 'quote' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileText className="w-4 h-4 mr-2" />
                3. Quote (Q)
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Historial
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${activeTab === 'admin' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none print:m-0">
        {/* --- CONFIGURE TAB --- */}
        {activeTab === 'configure' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configure: Inventario Molecular</h1>
                <p className="text-gray-500 mt-1">Selecciona los parámetros atómicos para armar el "Pack" exacto.</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                    onClick={collapseAllConfigureSections}
                    className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                >
                    Colapsar Todo
                </button>
                {packs.length > 0 && (
                    <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm p-1">
                        <div className="pl-3 pr-2 flex items-center text-sm font-medium text-gray-600 border-r border-gray-200">
                            <Package className="w-4 h-4 mr-2 text-indigo-500" />
                            Cargar Pack
                        </div>
                        <select
                            className="border-0 focus:ring-0 text-sm font-medium text-gray-900 bg-transparent pl-3 pr-8 py-1.5 w-48"
                            value=""
                            onChange={e => {
                                const pack = packs.find(p => p.id === e.target.value);
                                if (pack) loadPack(pack);
                            }}
                        >
                            <option value="">Selecciona un Pack...</option>
                            {packs.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {catalog.map((category) => {
                  const selectableItems = category.items.filter(item => !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id));
                  const allSelected = selectableItems.length > 0 && selectableItems.every(item => !!selectedServices[item.id]);

                  return (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div
                        className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleConfigureSection(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                          {configureExpandedSections[category.id] !== false ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          <div>
                              <h2 className="text-lg font-semibold text-gray-800">{category.name}</h2>
                              <p className="text-sm text-gray-500">{category.description}</p>
                          </div>
                      </div>

                      {selectableItems.length > 0 && configureExpandedSections[category.id] !== false && (
                          <div className="flex items-center animate-in fade-in" onClick={e => e.stopPropagation()}>
                              <label className="flex items-center cursor-pointer text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                  <input
                                      type="checkbox"
                                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      checked={allSelected}
                                      onChange={(e) => handleSelectAllInCategory(category.id, e.target.checked)}
                                  />
                                  Seleccionar todos
                              </label>
                          </div>
                      )}
                    </div>
                    {configureExpandedSections[category.id] !== false && (
                    <div className="divide-y divide-gray-100 animate-in slide-in-from-top-2 duration-200 fade-in">
                      {category.items.filter(item => !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id)).map((item) => {
                        const isSelected = !!selectedServices[item.id];
                        const selService = selectedServices[item.id];

                        return (
                          <div
                            key={item.id}
                            className={`p-4 transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between">
                                <div className="flex items-start flex-1 cursor-pointer" onClick={() => handleSelectService(item)}>
                                  <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded mr-2">{item.id}</span>
                                      <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{item.name}</span>
                                    </div>
                                    {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                                    <div className="text-xs text-gray-400 mt-1 flex items-center">
                                      {formatCurrency(item.basePrice)} / {item.unit}
                                      {item.recurring && <span className="ml-2 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium">Recurrente</span>}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (['hora', 'pantalla', 'módulo/CRUD', 'integración'].includes(item.unit)) && (
                                  <div className="flex items-center space-x-2 ml-4 bg-white px-2 py-1 rounded border border-gray-200">
                                    <label className="text-xs text-gray-500 font-medium">Cant.</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selService.quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                      className="w-16 text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                )}
                            </div>

                            {/* Custom Variables Section for Selected Items */}
                            {isSelected && item.variables && item.variables.length > 0 && (
                                <div className="mt-3 ml-8 p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center">
                                        <Variable className="w-3 h-3 mr-1" />
                                        Personalización de Cálculo para este Cliente
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {item.variables.map(v => (
                                            <div key={v.id} className="flex flex-col">
                                                <label className="text-xs font-medium text-gray-600 mb-1">{v.name}</label>
                                                <input
                                                    type="number"
                                                    value={selService.customVariables[v.id] ?? v.defaultValue}
                                                    onChange={(e) => handleUpdateCustomVariable(item.id, v.id, parseFloat(e.target.value) || 0)}
                                                    className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1 px-2 border font-mono"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-mono">Fórmula: {item.priceFormula}</span>
                                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            Costo Base Calculado: {formatCurrency(evaluateItemPrice(item, selService.customVariables))}
                                        </span>
                                    </div>
                                </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Resumen de Selección</h3>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-4 flex justify-between">
                      <span>Items seleccionados:</span>
                      <span className="font-bold text-gray-900">{Object.keys(selectedServices).length}</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Setup Único</div>
                        <div className="text-xl font-bold text-gray-900">{formatCurrency(calculatePrices.oneTimeBase)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Retainer Mensual</div>
                        <div className="text-xl font-bold text-purple-600">{formatCurrency(calculatePrices.recurringBase)}/mes</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('price')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors"
                      disabled={Object.keys(selectedServices).length === 0}
                    >
                      Siguiente: Valorizar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PRICE TAB --- */}
        {activeTab === 'price' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Price: Motor Matemático</h1>
              <p className="text-gray-500 mt-1">Configura modificadores y calcula el precio total (Modelo Híbrido).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 text-blue-500 mr-2" />
                    Modificadores Comerciales
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={modifiers.urgency}
                        onChange={(e) => setModifiers({...modifiers, urgency: e.target.checked})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">A-04: Recargo por Urgencia</span>
                        <span className="block text-sm text-gray-500">Multiplicador 1.5x para proyectos "para ayer" (Aplica a costo único).</span>
                      </div>
                    </label>

                    <label className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={modifiers.financing}
                        onChange={(e) => setModifiers({...modifiers, financing: e.target.checked})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">A-06: Recargo financiero</span>
                        <span className="block text-sm text-gray-500">Recargo de 5% por fraccionamiento de pagos.</span>
                      </div>
                    </label>

                    <label className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={modifiers.successFee}
                        onChange={(e) => setModifiers({...modifiers, successFee: e.target.checked})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">A-05: Tasa de riesgo/éxito (Startups)</span>
                        <span className="block text-sm text-gray-500">+10% markup al modelo en base a riesgo.</span>
                      </div>
                    </label>

                    <label className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={modifiers.thirdPartyMarkup}
                        onChange={(e) => setModifiers({...modifiers, thirdPartyMarkup: e.target.checked})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">A-07: Comisión por gestión de compras (15%)</span>
                        <span className="block text-sm text-gray-500">Aplica markup por licencias, plantillas o terceros.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 sticky top-24 overflow-hidden">
                  <div className="bg-gray-800 p-4 text-white">
                    <h3 className="font-semibold text-lg">Cálculo en Tiempo Real</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Subtotal Setup (Único)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(calculatePrices.oneTimeBase)}</span>
                    </div>

                    {modifiers.urgency && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 text-amber-600">
                        <span className="text-sm">+ Recargo Urgencia (50%)</span>
                        <span className="font-medium">{formatCurrency(calculatePrices.urgencyModifier)}</span>
                      </div>
                    )}

                    {modifiers.financing && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 text-blue-600">
                        <span className="text-sm">+ Recargo Financiero (5%)</span>
                        <span className="font-medium">{formatCurrency(calculatePrices.financingModifier)}</span>
                      </div>
                    )}

                    {modifiers.successFee && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 text-green-600">
                        <span className="text-sm">+ Tasa Éxito Startups (10%)</span>
                        <span className="font-medium">{formatCurrency(calculatePrices.successFeeModifier)}</span>
                      </div>
                    )}

                    {modifiers.thirdPartyMarkup && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 text-indigo-600">
                        <span className="text-sm">+ Comisión Terceros (15%)</span>
                        <span className="font-medium">{formatCurrency(calculatePrices.thirdPartyModifier)}</span>
                      </div>
                    )}

                    <div className="pt-4 flex justify-between items-end">
                      <div>
                        <span className="block text-sm font-bold text-gray-500 uppercase">Total Setup</span>
                      </div>
                      <span className="text-3xl font-bold text-gray-900">{formatCurrency(calculatePrices.oneTimeTotal)}</span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-end">
                      <div>
                        <span className="block text-sm font-bold text-gray-500 uppercase">Retainer Mensual</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{formatCurrency(calculatePrices.recurringTotal)}/mes</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleGenerateFinalDocument();
                        setActiveTab('quote');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                      Generar Documento Final (Q)
                      <FileText className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historial de Propuestas</h1>
                <p className="text-gray-500 mt-1">Respaldo de todas las cotizaciones generadas y guardadas.</p>
              </div>
            </div>

            {Object.keys(quotesByClient).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">El historial está vacío</h3>
                <p className="text-gray-500">Las cotizaciones aparecerán aquí organizadas por cliente una vez que uses el botón "Guardar e Imprimir PDF" en la pestaña Quote.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(quotesByClient).map(([clientName, quotes]) => (
                  <div key={clientName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                      <FolderOpen className="w-5 h-5 text-indigo-500 mr-3" />
                      <h2 className="text-lg font-bold text-gray-800 flex-1">{clientName}</h2>
                      <span className="text-sm font-medium text-gray-500 bg-white border px-2 py-0.5 rounded-md">{quotes.length} {quotes.length === 1 ? 'documento' : 'documentos'}</span>
                    </div>

                    <div className="divide-y divide-gray-100 p-0">
                      {quotes.map(quote => (
                        <div key={quote.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors group">
                          <div className="col-span-4">
                            <p className="font-semibold text-gray-900">{quote.quoteCustom.title}</p>
                            <p className="text-xs text-gray-500">ID: <span className="font-mono">{quote.id}</span></p>
                          </div>

                          <div className="col-span-3">
                            <p className="text-sm font-medium text-gray-700">{new Date(quote.date).toLocaleString('es-CL')}</p>
                            <p className="text-xs text-gray-500">Fecha de emisión</p>
                          </div>

                          <div className="col-span-3 text-right">
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(quote.totals.oneTimeTotal)}</p>
                            {quote.totals.recurringTotal > 0 && (
                              <p className="text-xs font-semibold text-purple-600">+{formatCurrency(quote.totals.recurringTotal)}/mes</p>
                            )}
                          </div>

                          <div className="col-span-2 flex justify-end space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => loadSavedQuote(quote)}
                              className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-md transition-colors flex items-center"
                              title="Cargar y Editar"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              <span className="text-xs font-medium">Cargar</span>
                            </button>
                            <button
                              onClick={() => deleteSavedQuote(quote.id)}
                              className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors flex items-center"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ADMIN TAB --- */}
        {activeTab === 'admin' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin: Control de Inventario</h1>
                        <p className="text-gray-500 mt-1">Modifica los valores, descripciones o agrega nuevos puntos al catálogo.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={collapseAllAdminSections}
                            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            Colapsar Todo
                        </button>
                        <button
                            onClick={handleResetCatalog}
                            className="flex items-center text-sm text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-colors bg-white shadow-sm"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Valores por Defecto
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* --- PDF SETTINGS --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div
                            className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleAdminSection('pdf')}
                        >
                            <div className="flex items-center space-x-3">
                                {adminExpandedSections['pdf'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Configuración Base del PDF</h2>
                                    <p className="text-sm text-gray-500">Define los valores globales que aparecerán por defecto en todas las cotizaciones.</p>
                                </div>
                            </div>
                            <div className="flex space-x-3" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setAdminPdfEditing(!adminPdfEditing)}
                                    className={`border font-medium py-1.5 px-3 rounded-md flex items-center transition-colors shadow-sm text-sm ${adminPdfEditing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                                >
                                    {adminPdfEditing ? <Settings className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                                    {adminPdfEditing ? 'Ocultar Editor Visual' : 'Editor Visual Base'}
                                </button>
                                <button
                                    onClick={handleSavePdfSettings}
                                    className="flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    Guardar Config. PDF
                                </button>
                            </div>
                        </div>

                        {adminExpandedSections['pdf'] && (
                        <div className="animate-in slide-in-from-top-2 duration-200 fade-in">
                        {adminPdfEditing ? (
                            <div className="bg-gray-200 p-8 border-b border-gray-300 overflow-x-auto relative min-h-screen">
                                <div className="max-w-4xl mx-auto mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-2 text-sm font-medium text-gray-600">
                                    <p className="flex items-center"><Edit3 className="w-4 h-4 mr-2 text-indigo-500" /> <span className="font-bold text-gray-900 mr-1">Editor Visual Integral:</span> Haz clic en los textos para editarlos directamente.</p>
                                    <p>Arrastra o usa las flechas que aparecen al pasar el mouse sobre cada bloque para reordenarlos. Haz clic en el ícono del ojo para ocultar componentes y columnas de las tablas.</p>
                                </div>
                                <div className="transform origin-top transition-transform min-w-[800px] scale-90 mx-auto pb-48">
                                    {renderPdfDocument('admin')}
                                </div>

                                {/* Floating Global Palette Sidebar */}
                                <div className="fixed top-24 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 z-50 flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
                                    <div className="p-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                        <h4 className="font-extrabold text-gray-900 flex items-center text-sm tracking-tight">
                                            <Palette className="w-4 h-4 mr-2 text-indigo-600" />
                                            Estudio de Diseño PDF
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-semibold">Configuración Global</p>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
                                        <button onClick={() => setActivePaletteTab('brand')} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors border-b-2 ${activePaletteTab === 'brand' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                            <ImageIcon className="w-4 h-4 mb-1" />
                                            <span className="text-[10px] font-bold">Marca</span>
                                        </button>
                                        <button onClick={() => setActivePaletteTab('typography')} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors border-b-2 ${activePaletteTab === 'typography' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                            <TypeIcon className="w-4 h-4 mb-1" />
                                            <span className="text-[10px] font-bold">Texto</span>
                                        </button>
                                        <button onClick={() => setActivePaletteTab('layout')} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors border-b-2 ${activePaletteTab === 'layout' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                            <LayoutTemplate className="w-4 h-4 mb-1" />
                                            <span className="text-[10px] font-bold">Diseño</span>
                                        </button>
                                        <button onClick={() => setActivePaletteTab('components')} className={`flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors border-b-2 ${activePaletteTab === 'components' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                            <Settings className="w-4 h-4 mb-1" />
                                            <span className="text-[10px] font-bold">Bloques</span>
                                        </button>
                                    </div>

                                    <div className="p-5 overflow-y-auto flex-1 bg-white" style={{ minHeight: '320px' }}>
                                        {/* TAB: BRAND & COLORS */}
                                        {activePaletteTab === 'brand' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Logotipo Corporativo</label>
                                                    <div className="flex flex-col space-y-2">
                                                        {pdfSettings.logoUrl && (
                                                            <div className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center relative group overflow-hidden">
                                                                <img src={pdfSettings.logoUrl} alt="Logo" className="max-h-16 max-w-[80%] object-contain" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <button onClick={() => setPdfSettings({...pdfSettings, logoUrl: ''})} className="bg-white text-red-600 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <label className={`w-full cursor-pointer flex items-center justify-center bg-white border-2 border-dashed ${pdfSettings.logoUrl ? 'border-gray-300 py-2' : 'border-indigo-300 bg-indigo-50/50 py-8'} rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors`}>
                                                            <div className="text-center">
                                                                {!pdfSettings.logoUrl && <ImageIcon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />}
                                                                <span className="text-xs font-semibold text-indigo-600">{pdfSettings.logoUrl ? 'Reemplazar imagen...' : 'Subir logotipo de la empresa'}</span>
                                                                {!pdfSettings.logoUrl && <p className="text-[10px] text-gray-500 mt-1">PNG, JPG o SVG (Max 2MB)</p>}
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            setPdfSettings({...pdfSettings, logoUrl: reader.result as string});
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-4">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-3">Paleta de Colores</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-600">Primario</label>
                                                            <div className="flex items-center space-x-2 border border-gray-200 bg-white rounded-lg p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                                                                <input
                                                                    type="color"
                                                                    value={pdfSettings.primaryColor}
                                                                    onChange={(e) => setPdfSettings({...pdfSettings, primaryColor: e.target.value})}
                                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer shrink-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={pdfSettings.primaryColor.toUpperCase()}
                                                                    onChange={(e) => setPdfSettings({...pdfSettings, primaryColor: e.target.value})}
                                                                    className="w-full text-xs font-mono font-medium text-gray-700 border-none bg-transparent p-0 focus:ring-0"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="block text-xs font-semibold text-gray-600">Acento</label>
                                                            <div className="flex items-center space-x-2 border border-gray-200 bg-white rounded-lg p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                                                                <input
                                                                    type="color"
                                                                    value={pdfSettings.accentColor}
                                                                    onChange={(e) => setPdfSettings({...pdfSettings, accentColor: e.target.value})}
                                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer shrink-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={pdfSettings.accentColor.toUpperCase()}
                                                                    onChange={(e) => setPdfSettings({...pdfSettings, accentColor: e.target.value})}
                                                                    className="w-full text-xs font-mono font-medium text-gray-700 border-none bg-transparent p-0 focus:ring-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: TYPOGRAPHY */}
                                        {activePaletteTab === 'typography' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Familia Tipográfica</label>
                                                    <div className="space-y-2">
                                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${pdfSettings.fontFamily === 'font-inter' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                                            <input type="radio" name="font" checked={pdfSettings.fontFamily === 'font-inter'} onChange={() => setPdfSettings({...pdfSettings, fontFamily: 'font-inter'})} className="sr-only" />
                                                            <span className="text-xl font-bold font-inter w-8 text-center text-gray-800">Aa</span>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-bold font-inter text-gray-900 leading-none">Inter</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">Limpia, moderna, digital</p>
                                                            </div>
                                                        </label>

                                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${pdfSettings.fontFamily === 'font-montserrat' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                                            <input type="radio" name="font" checked={pdfSettings.fontFamily === 'font-montserrat'} onChange={() => setPdfSettings({...pdfSettings, fontFamily: 'font-montserrat'})} className="sr-only" />
                                                            <span className="text-xl font-bold font-montserrat w-8 text-center text-gray-800">Aa</span>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-bold font-montserrat text-gray-900 leading-none">Montserrat</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">Geométrica, corporativa</p>
                                                            </div>
                                                        </label>

                                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${pdfSettings.fontFamily === 'font-nunito' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                                            <input type="radio" name="font" checked={pdfSettings.fontFamily === 'font-nunito'} onChange={() => setPdfSettings({...pdfSettings, fontFamily: 'font-nunito'})} className="sr-only" />
                                                            <span className="text-xl font-bold font-nunito w-8 text-center text-gray-800">Aa</span>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-bold font-nunito text-gray-900 leading-none">Nunito</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">Redondeada, amigable</p>
                                                            </div>
                                                        </label>

                                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${pdfSettings.fontFamily === 'font-playfair' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                                            <input type="radio" name="font" checked={pdfSettings.fontFamily === 'font-playfair'} onChange={() => setPdfSettings({...pdfSettings, fontFamily: 'font-playfair'})} className="sr-only" />
                                                            <span className="text-xl font-bold font-playfair w-8 text-center text-gray-800">Aa</span>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-bold font-playfair text-gray-900 leading-none">Playfair Display</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">Elegante, premium, serif</p>
                                                            </div>
                                                        </label>

                                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${pdfSettings.fontFamily === 'font-lora' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                                                            <input type="radio" name="font" checked={pdfSettings.fontFamily === 'font-lora'} onChange={() => setPdfSettings({...pdfSettings, fontFamily: 'font-lora'})} className="sr-only" />
                                                            <span className="text-xl font-bold font-lora w-8 text-center text-gray-800">Aa</span>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-bold font-lora text-gray-900 leading-none">Lora</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">Clásica, editorial, formal</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-4">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Estilo de Encabezados</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, sectionHeaders: 'plain'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.sectionHeaders === 'plain' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-1 bg-gray-300 mb-1 rounded-sm"></div>
                                                            Sencillo
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, sectionHeaders: 'underlined'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.sectionHeaders === 'underlined' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-1 bg-indigo-500 mb-1 rounded-sm"></div>
                                                            Subrayado
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, sectionHeaders: 'filled'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.sectionHeaders === 'filled' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-3 bg-indigo-100 mb-1 rounded-sm border-l-2 border-indigo-500"></div>
                                                            Relleno
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: LAYOUT */}
                                        {activePaletteTab === 'layout' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Tema Estructural</label>
                                                    <select
                                                        value={pdfSettings.themeStyle}
                                                        onChange={(e) => setPdfSettings({...pdfSettings, themeStyle: e.target.value as PdfSettings['themeStyle']})}
                                                        className="w-full text-sm font-medium border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-white"
                                                    >
                                                        <option value="professional">Profesional (Corporativo y Limpio)</option>
                                                        <option value="standard">Estándar (Clásico y Compacto)</option>
                                                        <option value="creative">Creativo (Moderno y Dinámico)</option>
                                                    </select>
                                                </div>

                                                <div className="border-t border-gray-100 pt-4">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Alineación del Encabezado</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'left'})}
                                                            className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${pdfSettings.headerLayout === 'left' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                            title="Izquierda"
                                                        >
                                                            <AlignLeft className="w-5 h-5 mb-1" />
                                                            <span className="text-[10px] font-bold">Izquierda</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'center'})}
                                                            className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${pdfSettings.headerLayout === 'center' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                            title="Centro"
                                                        >
                                                            <AlignCenter className="w-5 h-5 mb-1" />
                                                            <span className="text-[10px] font-bold">Centro</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, headerLayout: 'split'})}
                                                            className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-colors ${pdfSettings.headerLayout === 'split' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                            title="Dividido"
                                                        >
                                                            <AlignJustify className="w-5 h-5 mb-1" />
                                                            <span className="text-[10px] font-bold">Dividido</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-4">
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Estilo de Tablas</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, tableStyle: 'minimal'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.tableStyle === 'minimal' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-px bg-gray-400 mb-1"></div>
                                                            Minimalista
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, tableStyle: 'striped'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.tableStyle === 'striped' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-2 bg-gray-100 mb-[2px]"></div>
                                                            <div className="w-8 h-2 bg-white mb-1"></div>
                                                            Cebra
                                                        </button>
                                                        <button
                                                            onClick={() => setPdfSettings({...pdfSettings, tableStyle: 'bordered'})}
                                                            className={`py-2 px-1 border rounded text-xs font-semibold flex flex-col items-center justify-center transition-colors ${pdfSettings.tableStyle === 'bordered' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <div className="w-8 h-4 border border-gray-300 mb-1 rounded-sm grid grid-cols-2 gap-0"><div className="border-r border-gray-300"></div></div>
                                                            Bordes
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: COMPONENTS & BLOCKS */}
                                        {activePaletteTab === 'components' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                    <label className="flex items-start cursor-pointer">
                                                        <div className="flex items-center h-5">
                                                            <input
                                                                type="checkbox"
                                                                checked={pdfSettings.showCoverPage}
                                                                onChange={(e) => setPdfSettings({...pdfSettings, showCoverPage: e.target.checked})}
                                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            />
                                                        </div>
                                                        <div className="ml-3">
                                                            <span className="block text-sm font-bold text-gray-800">Incluir Portada</span>
                                                            <span className="block text-xs text-gray-500 mt-0.5">Agrega una hoja de presentación al inicio del documento.</span>
                                                        </div>
                                                    </label>
                                                </div>

                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                    <label className="flex items-start cursor-pointer">
                                                        <div className="flex items-center h-5">
                                                            <input
                                                                type="checkbox"
                                                                checked={pdfSettings.showItemCodes}
                                                                onChange={(e) => setPdfSettings({...pdfSettings, showItemCodes: e.target.checked})}
                                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            />
                                                        </div>
                                                        <div className="ml-3">
                                                            <span className="block text-sm font-bold text-gray-800">Mostrar Códigos SKU</span>
                                                            <span className="block text-xs text-gray-500 mt-0.5">Muestra los códigos de servicio en las tablas de cotización.</span>
                                                        </div>
                                                    </label>
                                                </div>

                                                {/* Hidden Blocks Restorer */}
                                                {(() => {
                                                    const masterBlocks = [
                                                        { id: 'cover', name: 'Portada' },
                                                        { id: 'header', name: 'Encabezado' },
                                                        { id: 'client', name: 'Datos del Cliente' },
                                                        { id: 'intro', name: 'Introducción' },
                                                        { id: 'title', name: 'Título Principal' },
                                                        { id: 'setup', name: 'Tabla: Setup Único' },
                                                        { id: 'retainer', name: 'Tabla: Retainer Mensual' },
                                                        { id: 'totals', name: 'Resumen de Inversión' },
                                                        { id: 'footer', name: 'Pie de Página' }
                                                    ];
                                                    const hiddenBlocks = masterBlocks.filter(b => !pdfSettings.layoutBlocks.includes(b.id));

                                                    if (hiddenBlocks.length === 0) return (
                                                        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                                                            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
                                                            <span className="text-xs font-medium text-gray-500">Todos los bloques están visibles</span>
                                                        </div>
                                                    );

                                                    return (
                                                        <div className="border border-red-100 bg-red-50/30 rounded-lg p-3">
                                                            <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center">
                                                                <EyeOff className="w-3 h-3 mr-1" /> Componentes Ocultos
                                                            </label>
                                                            <div className="space-y-2">
                                                                {hiddenBlocks.map(block => (
                                                                    <div key={block.id} className="flex justify-between items-center bg-white rounded-md px-2.5 py-2 border border-red-100 shadow-sm">
                                                                        <span className="text-xs font-semibold text-gray-700">{block.name}</span>
                                                                        <button
                                                                            onClick={() => toggleBlockVisibility(block.id)}
                                                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-1 rounded transition-colors"
                                                                        >
                                                                            Restaurar
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                                        <button
                                            onClick={handleSavePdfSettings}
                                            className="w-full flex justify-center items-center text-sm font-bold text-white bg-green-600 hover:bg-green-700 py-2.5 rounded-lg transition-colors shadow-sm"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-gray-50">
                                <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Modo de Visualización Inactivo</h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">Haz clic en el botón superior "Editor Visual Base" para personalizar los textos, colores, tipografía y columnas viendo el documento real.</p>
                                <button
                                    onClick={() => setAdminPdfEditing(true)}
                                    className="border font-medium py-2 px-6 rounded-lg inline-flex items-center transition-colors shadow-sm text-sm bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Abrir Editor Visual
                                </button>
                            </div>
                        )}
                        </div>
                        )}
                    </div>

                    {/* --- PACKS MANAGEMENT --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div
                            className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleAdminSection('packs')}
                        >
                            <div className="flex items-center space-x-3">
                                {adminExpandedSections['packs'] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center"><Package className="w-5 h-5 mr-2 text-indigo-500" /> Gestión de Packs Predefinidos</h2>
                                    <p className="text-sm text-gray-500">Agrupa servicios y define valores por defecto específicos para crear planes listos para vender.</p>
                                </div>
                            </div>
                            <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={handleCreatePack}
                                    className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Nuevo Pack
                                </button>
                                <button
                                    onClick={handleSavePacks}
                                    className="flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    Guardar Packs
                                </button>
                            </div>
                        </div>

                        {adminExpandedSections['packs'] && (
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-200 fade-in">
                            {packs.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-4">Aún no has creado ningún Pack.</p>
                            ) : (
                                packs.map(pack => (
                                    <div key={pack.id} className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/20 relative">
                                        <button
                                            onClick={() => handleDeletePack(pack.id)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="grid grid-cols-2 gap-4 mb-4 pr-8">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Pack</label>
                                                <input
                                                    type="text"
                                                    value={pack.name}
                                                    onChange={e => handleUpdatePack({...pack, name: e.target.value})}
                                                    className="w-full border-gray-300 rounded shadow-sm py-1.5 px-2 text-sm font-bold text-indigo-900 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                                                <input
                                                    type="text"
                                                    value={pack.description}
                                                    onChange={e => handleUpdatePack({...pack, description: e.target.value})}
                                                    className="w-full border-gray-300 rounded shadow-sm py-1.5 px-2 text-sm text-gray-600 border"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white rounded border border-gray-200 p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs font-semibold text-gray-700">Servicios incluidos en el Pack</label>
                                                <select
                                                    className="text-xs border-gray-300 rounded py-1 pl-2 pr-6 border bg-gray-50"
                                                    value=""
                                                    onChange={e => {
                                                        if (e.target.value) {
                                                            const newItemId = e.target.value;
                                                            if (!pack.items.find(i => i.itemId === newItemId)) {
                                                                const catItem = getCatalogItem(newItemId);
                                                                const initialVars: Record<string, number> = {};
                                                                if (catItem?.variables) {
                                                                    catItem.variables.forEach(v => initialVars[v.id] = v.defaultValue);
                                                                }
                                                                handleUpdatePack({...pack, items: [...pack.items, { itemId: newItemId, overriddenVariables: initialVars }]});
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="">+ Añadir servicio al pack...</option>
                                                    {catalog.map(cat => (
                                                        <optgroup key={cat.id} label={cat.name}>
                                                            {cat.items.map(item => (
                                                                <option key={item.id} value={item.id}>{item.id} - {item.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>

                                            {pack.items.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No hay servicios en este pack.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {pack.items.map((pItem, pIdx) => {
                                                        const catItem = getCatalogItem(pItem.itemId);
                                                        if (!catItem) return null;

                                                        return (
                                                            <div key={pIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-2 bg-gray-50 rounded border border-gray-100">
                                                                <div className="flex-1 flex items-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newItems = pack.items.filter((_, i) => i !== pIdx);
                                                                            handleUpdatePack({...pack, items: newItems});
                                                                        }}
                                                                        className="text-gray-400 hover:text-red-500 mr-2"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                    <span className="text-xs font-mono font-bold text-gray-500 mr-2">{catItem.id}</span>
                                                                    <span className="text-sm font-medium text-gray-800">{catItem.name}</span>
                                                                </div>

                                                                {catItem.variables && catItem.variables.length > 0 && (
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {catItem.variables.map(v => (
                                                                            <div key={v.id} className="flex items-center bg-white border border-gray-200 rounded px-2 py-0.5">
                                                                                <span className="text-[10px] font-bold text-indigo-600 mr-1">{v.name}:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={pItem.overriddenVariables[v.id] ?? v.defaultValue}
                                                                                    onChange={e => {
                                                                                        const newVars = {...pItem.overriddenVariables, [v.id]: parseFloat(e.target.value) || 0};
                                                                                        const newItems = [...pack.items];
                                                                                        newItems[pIdx] = { ...pItem, overriddenVariables: newVars };
                                                                                        handleUpdatePack({...pack, items: newItems});
                                                                                    }}
                                                                                    className="w-12 text-xs border-none bg-transparent focus:ring-0 p-0 text-right font-mono"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        )}
                    </div>

                    {catalog.map(category => (
                        <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleAdminSection(category.id)}
                            >
                                <div className="flex items-center space-x-3">
                                    {adminExpandedSections[category.id] !== false ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">{category.name}</h2>
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleAddItem(category.id)}
                                        className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Añadir Item
                                    </button>
                                    <button
                                        onClick={() => handleSaveCategory()}
                                        className="flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>

                            {adminExpandedSections[category.id] !== false && (
                            <div className="divide-y divide-gray-100 p-2 animate-in slide-in-from-top-2 duration-200 fade-in">
                                {category.items.map(item => (
                                    <div key={item.id} className="p-4 grid grid-cols-12 gap-4 items-start hover:bg-gray-50 transition-colors rounded-lg group">
                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">ID</label>
                                            <input
                                                type="text"
                                                value={item.id}
                                                onChange={(e) => handleUpdateItem(category.id, item.id, {...item, id: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-1.5 px-2 border"
                                            />
                                        </div>

                                        <div className="col-span-4 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Nombre & Descripción</label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdateItem(category.id, item.id, {...item, name: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium text-gray-900 py-1.5 px-2 border mb-2"
                                            />
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleUpdateItem(category.id, item.id, {...item, description: e.target.value})}
                                                placeholder="Descripción (opcional)"
                                                rows={2}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-gray-500 py-1.5 px-2 border resize-none"
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Precio Base</label>
                                            <input
                                                type="number"
                                                value={item.basePrice}
                                                onChange={(e) => handleUpdateItem(category.id, item.id, {...item, basePrice: parseFloat(e.target.value) || 0})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono py-1.5 px-2 border"
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Unidad</label>
                                            <select
                                                value={item.unit}
                                                onChange={(e) => handleUpdateItem(category.id, item.id, {...item, unit: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-1.5 px-2 border bg-white"
                                            >
                                                <option value="global">Global (Único)</option>
                                                <option value="hora">Por Hora</option>
                                                <option value="pantalla">Por Pantalla</option>
                                                <option value="módulo/CRUD">Por Módulo</option>
                                                <option value="integración">Por Integración</option>
                                                <option value="mensual">Mensual (Retainer)</option>
                                                <option value="multiplicador">Multiplicador (1.5x)</option>
                                                <option value="porcentaje">Porcentaje (0.1)</option>
                                            </select>
                                        </div>

                                        <div className="col-span-1 space-y-2 text-center">
                                             <label className="block text-xs font-semibold text-gray-500 uppercase">Mensual</label>
                                             <div className="flex justify-center pt-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.recurring}
                                                    onChange={(e) => handleUpdateItem(category.id, item.id, {...item, recurring: e.target.checked})}
                                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                                />
                                             </div>
                                        </div>

                                        <div className="col-span-1 space-y-2 flex justify-end items-end h-full pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button
                                                onClick={() => handleDeleteItem(category.id, item.id)}
                                                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                                                title="Eliminar Item"
                                             >
                                                <Trash2 className="w-5 h-5" />
                                             </button>
                                        </div>

                                        {/* Variables & Formula Editor */}
                                        <div className="col-span-12 mt-4 pt-4 border-t border-gray-200 bg-white p-4 rounded-lg border">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-gray-700 flex items-center">
                                                    <Variable className="w-4 h-4 mr-1 text-indigo-500" />
                                                    Campos Dinámicos y Cálculo (Opcional)
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        const newVars = [...(item.variables || []), { id: `var${(item.variables?.length || 0) + 1}`, name: 'Nuevo Campo', defaultValue: 1 }];
                                                        handleUpdateItem(category.id, item.id, { ...item, variables: newVars, priceFormula: item.priceFormula || 'basePrice' });
                                                    }}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Añadir Campo
                                                </button>
                                            </div>

                                            {item.variables && item.variables.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                                    {item.variables.map((v, vIdx) => (
                                                        <div key={vIdx} className="bg-indigo-50/50 p-3 rounded border border-indigo-100 flex items-center gap-2">
                                                            <div className="flex-1 space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={v.id}
                                                                    onChange={(e) => {
                                                                        const newVars = [...item.variables!];
                                                                        newVars[vIdx].id = e.target.value.replace(/[^a-zA-Z0-9_]/g, ''); // alphanumeric only
                                                                        handleUpdateItem(category.id, item.id, { ...item, variables: newVars });
                                                                    }}
                                                                    placeholder="ID (ej: horas)"
                                                                    className="w-full text-xs font-mono border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2 border"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={v.name}
                                                                    onChange={(e) => {
                                                                        const newVars = [...item.variables!];
                                                                        newVars[vIdx].name = e.target.value;
                                                                        handleUpdateItem(category.id, item.id, { ...item, variables: newVars });
                                                                    }}
                                                                    placeholder="Nombre Público"
                                                                    className="w-full text-xs border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2 border"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-[10px] text-gray-500 whitespace-nowrap">Valor por Defecto:</label>
                                                                    <input
                                                                        type="number"
                                                                        value={v.defaultValue}
                                                                        onChange={(e) => {
                                                                            const newVars = [...item.variables!];
                                                                            newVars[vIdx].defaultValue = parseFloat(e.target.value) || 0;
                                                                            handleUpdateItem(category.id, item.id, { ...item, variables: newVars });
                                                                        }}
                                                                        className="w-full text-xs border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2 border"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newVars = item.variables!.filter((_, i) => i !== vIdx);
                                                                    handleUpdateItem(category.id, item.id, { ...item, variables: newVars });
                                                                }}
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3">
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Fórmula de Precio (Matemática simple)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.priceFormula || 'basePrice'}
                                                        onChange={(e) => handleUpdateItem(category.id, item.id, { ...item, priceFormula: e.target.value })}
                                                        placeholder="ej: basePrice + (horas * tarifa)"
                                                        className="flex-1 text-sm font-mono border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3 border"
                                                    />
                                                    <span className="text-[10px] text-gray-500 max-w-[200px] leading-tight">
                                                        Usa <code className="bg-gray-100 px-1 rounded">basePrice</code> o los IDs que crees arriba. Usa +, -, *, /, (, ).
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- QUOTE TAB --- */}
        {activeTab === 'quote' && (
          <div className="space-y-6 animate-in fade-in duration-300 print:space-y-0 print:block">
             <div className="flex justify-between items-center mb-6 print:hidden">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quote: Propuesta Comercial</h1>
                <p className="text-gray-500 mt-1">Salida final lista para ser enviada o impresa por el cliente.</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateFinalDocument}
                  className="bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generar documento Final (Q)
                </button>
                <button
                  onClick={async () => {
                      if (!quoteDraft) return;
                      const updatedDraft = {
                          ...quoteDraft,
                          quoteCustom: { ...quoteDraft.quoteCustom, isEditing: !quoteDraft.quoteCustom.isEditing }
                      };
                      setQuoteDraft(updatedDraft);
                      await saveDataToServer('cpq-quote-draft', updatedDraft);
                  }}
                  disabled={!quoteDraft}
                  className={`border font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm disabled:opacity-50 ${quoteDraft?.quoteCustom.isEditing ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  {quoteDraft?.quoteCustom.isEditing ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  {quoteDraft?.quoteCustom.isEditing ? 'Modo Vista Previa' : 'Modo Edición PDF'}
                </button>
                <button onClick={handleSaveAndPrint} disabled={!quoteDraft} className="bg-blue-600 border border-blue-700 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm disabled:opacity-50">
                  <FileText className="w-4 h-4 mr-2" />
                  Guardar e Imprimir PDF
                </button>
              </div>
            </div>


            {/* Document to print mapped correctly with new dynamic renderer */}
            {renderPdfDocument('quote')}
          </div>
        )}
      </main>
    </div>
  );
}
