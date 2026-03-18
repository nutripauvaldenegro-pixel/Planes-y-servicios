import { useState, useMemo } from 'react';
import { catalog as defaultCatalog } from './data/catalog';
import type { ServiceItem, Category } from './data/catalog';
import { Check, Info, FileText, ChevronRight, Calculator, CheckCircle2, Settings, Plus, Trash2, RotateCcw } from 'lucide-react';

type SelectedService = {
  item: ServiceItem;
  quantity: number;
};

type Modifiers = {
  urgency: boolean;
  successFee: boolean;
  financing: boolean;
  thirdPartyMarkup: boolean;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'configure' | 'price' | 'quote' | 'admin'>('configure');

  const [catalog, setCatalog] = useState<Category[]>(() => {
    const saved = localStorage.getItem('cpq-catalog');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Error parsing catalog', e); }
    }
    return defaultCatalog;
  });

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

  // Toggle selection
  const handleSelectService = (item: ServiceItem) => {
    setSelectedServices(prev => {
      const isSelected = !!prev[item.id];
      if (isSelected) {
        const newObj = { ...prev };
        delete newObj[item.id];
        return newObj;
      } else {
        return {
          ...prev,
          [item.id]: { item, quantity: 1 }
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

  const calculatePrices = useMemo(() => {
    let oneTimeBase = 0;
    let recurringBase = 0;

    // Filter out modifier items if we want to handle them purely as boolean modifiers
    // For this prototype, if it's selected directly, we'll calculate it
    const services = Object.values(selectedServices);

    services.forEach(({ item, quantity }) => {
      // Skip the A-04 to A-07 items as base calculation, we'll apply them via toggles
      if (['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id)) return;

      const cost = item.basePrice * quantity;
      if (item.recurring) {
        recurringBase += cost;
      } else {
        oneTimeBase += cost;
      }
    });

    let oneTimeTotal = oneTimeBase;
    const recurringTotal = recurringBase;

    // Apply modifiers
    if (modifiers.urgency) {
      // A-04: Recargo por Urgencia (1.5x on one-time)
      oneTimeTotal *= 1.5;
    }

    if (modifiers.financing) {
      // A-06: Recargo financiero (5%)
      oneTimeTotal *= 1.05;
    }

    if (modifiers.successFee) {
      // A-05: Tasa de riesgo/éxito (Success Fee 10%)
      oneTimeTotal *= 1.10;
    }

    if (modifiers.thirdPartyMarkup) {
      // A-07: Comisión por compras (15% - arbitrarily applying to a portion or whole for demo)
      oneTimeTotal *= 1.15;
    }

    return {
      oneTimeBase,
      recurringBase,
      oneTimeTotal,
      recurringTotal,
      urgencyModifier: modifiers.urgency ? oneTimeBase * 0.5 : 0,
      financingModifier: modifiers.financing ? (oneTimeBase * (modifiers.urgency ? 1.5 : 1)) * 0.05 : 0,
      successFeeModifier: modifiers.successFee ? oneTimeBase * 0.10 : 0,
      thirdPartyModifier: modifiers.thirdPartyMarkup ? oneTimeBase * 0.15 : 0,
    };
  }, [selectedServices, modifiers]);

  const saveCatalog = (newCatalog: Category[]) => {
    setCatalog(newCatalog);
    localStorage.setItem('cpq-catalog', JSON.stringify(newCatalog));
  };

  const handleUpdateItem = (categoryId: string, updatedItem: ServiceItem) => {
    const newCatalog = catalog.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === updatedItem.id ? updatedItem : item)
      };
    });
    saveCatalog(newCatalog);

    // Update selectedServices if modified item is selected to reflect changes instantly
    if (selectedServices[updatedItem.id]) {
        setSelectedServices(prev => ({
            ...prev,
            [updatedItem.id]: {
                ...prev[updatedItem.id],
                item: updatedItem
            }
        }));
    }
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
    saveCatalog(newCatalog);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const newCatalog = catalog.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
            ...cat,
            items: cat.items.filter(item => item.id !== itemId)
        };
    });
    saveCatalog(newCatalog);

    if (selectedServices[itemId]) {
        const newSelected = {...selectedServices};
        delete newSelected[itemId];
        setSelectedServices(newSelected);
    }
  };

  const handleResetCatalog = () => {
      if (confirm('¿Estás seguro de restaurar el catálogo a sus valores por defecto? Perderás todos los cambios.')) {
          setCatalog(defaultCatalog);
          localStorage.removeItem('cpq-catalog');
          setSelectedServices({});
      }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- CONFIGURE TAB --- */}
        {activeTab === 'configure' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Configure: Inventario Molecular</h1>
              <p className="text-gray-500 mt-1">Selecciona los parámetros atómicos para armar el "Pack" exacto.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {catalog.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h2 className="text-lg font-semibold text-gray-800">{category.name}</h2>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {category.items.filter(item => !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id)).map((item) => {
                        const isSelected = !!selectedServices[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`p-4 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          >
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
                                  value={selectedServices[item.id].quantity}
                                  onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 text-sm border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Cliente (Opcional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
                      <input type="text" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Empresa</label>
                      <input type="text" value={clientInfo.company} onChange={e => setClientInfo({...clientInfo, company: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    </div>
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
                      onClick={() => setActiveTab('quote')}
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

        {/* --- ADMIN TAB --- */}
        {activeTab === 'admin' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin: Control de Inventario</h1>
                        <p className="text-gray-500 mt-1">Modifica los valores, descripciones o agrega nuevos puntos al catálogo.</p>
                    </div>
                    <button
                        onClick={handleResetCatalog}
                        className="flex items-center text-sm text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-colors bg-white shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar a Valores por Defecto
                    </button>
                </div>

                <div className="space-y-6">
                    {catalog.map(category => (
                        <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{category.name}</h2>
                                    <p className="text-sm text-gray-500">{category.description}</p>
                                </div>
                                <button
                                    onClick={() => handleAddItem(category.id)}
                                    className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Añadir Item
                                </button>
                            </div>

                            <div className="divide-y divide-gray-100 p-2">
                                {category.items.map(item => (
                                    <div key={item.id} className="p-4 grid grid-cols-12 gap-4 items-start hover:bg-gray-50 transition-colors rounded-lg group">
                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">ID</label>
                                            <input
                                                type="text"
                                                value={item.id}
                                                onChange={(e) => handleUpdateItem(category.id, {...item, id: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-1.5 px-2 border"
                                            />
                                        </div>

                                        <div className="col-span-4 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Nombre & Descripción</label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdateItem(category.id, {...item, name: e.target.value})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium text-gray-900 py-1.5 px-2 border mb-2"
                                            />
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleUpdateItem(category.id, {...item, description: e.target.value})}
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
                                                onChange={(e) => handleUpdateItem(category.id, {...item, basePrice: parseFloat(e.target.value) || 0})}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono py-1.5 px-2 border"
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase">Unidad</label>
                                            <select
                                                value={item.unit}
                                                onChange={(e) => handleUpdateItem(category.id, {...item, unit: e.target.value})}
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
                                                    onChange={(e) => handleUpdateItem(category.id, {...item, recurring: e.target.checked})}
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- QUOTE TAB --- */}
        {activeTab === 'quote' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quote: Propuesta Comercial</h1>
                <p className="text-gray-500 mt-1">Salida final lista para ser enviada o impresa por el cliente.</p>
              </div>
              <button onClick={() => window.print()} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Imprimir PDF
              </button>
            </div>

            {/* Document to print */}
            <div className="bg-white shadow-lg border border-gray-200 mx-auto max-w-4xl p-10 print:shadow-none print:border-none print:p-0">
              <div className="border-b-2 border-blue-600 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">iStudio</h1>
                  <p className="text-blue-600 font-semibold tracking-wide">Propuesta de Servicios</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Fecha: {new Date(clientInfo.date).toLocaleDateString('es-CL')}</p>
                  <p>Cotización Nº: {clientInfo.date.replace(/-/g, '').slice(2)}01</p>
                </div>
              </div>

              {(clientInfo.name || clientInfo.company) && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preparado para</h3>
                  <p className="font-semibold text-gray-900 text-lg">{clientInfo.name || 'Cliente'}</p>
                  {clientInfo.company && <p className="text-gray-600">{clientInfo.company}</p>}
                </div>
              )}

              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Alcance del Proyecto (Modelo Híbrido)</h2>

                {/* One Time Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 bg-gray-50 p-2 rounded">1. Servicios de Setup (Pago Único)</h3>
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-2 font-medium">Código</th>
                        <th className="py-2 font-medium">Descripción</th>
                        <th className="py-2 font-medium text-center">Cant.</th>
                        <th className="py-2 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(selectedServices)
                        .filter(({item}) => !item.recurring && !['A-04', 'A-05', 'A-06', 'A-07'].includes(item.id))
                        .map(({item, quantity}) => (
                        <tr key={item.id}>
                          <td className="py-3 font-mono text-xs text-gray-500">{item.id}</td>
                          <td className="py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="py-3 text-center text-gray-600">{quantity}</td>
                          <td className="py-3 text-right text-gray-900">{formatCurrency(item.basePrice * quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recurring Items */}
                {Object.values(selectedServices).some(({item}) => item.recurring) && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 bg-purple-50 p-2 rounded text-purple-900">2. Servicios Retainer (Mensual)</h3>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="py-2 font-medium">Código</th>
                          <th className="py-2 font-medium">Descripción</th>
                          <th className="py-2 font-medium text-right">Valor Mensual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.values(selectedServices)
                          .filter(({item}) => item.recurring)
                          .map(({item, quantity}) => (
                          <tr key={item.id}>
                            <td className="py-3 font-mono text-xs text-gray-500">{item.id}</td>
                            <td className="py-3 font-medium text-gray-900">{item.name}</td>
                            <td className="py-3 text-right text-gray-900">{formatCurrency(item.basePrice * quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-wider">Resumen de Inversión</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal Setup</span>
                    <span>{formatCurrency(calculatePrices.oneTimeBase)}</span>
                  </div>

                  {modifiers.urgency && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Recargo Urgencia (A-04)</span>
                      <span>{formatCurrency(calculatePrices.urgencyModifier)}</span>
                    </div>
                  )}
                  {modifiers.financing && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Recargo Financiamiento (A-06)</span>
                      <span>{formatCurrency(calculatePrices.financingModifier)}</span>
                    </div>
                  )}
                  {modifiers.successFee && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Tasa de Éxito Startups (A-05)</span>
                      <span>{formatCurrency(calculatePrices.successFeeModifier)}</span>
                    </div>
                  )}
                  {modifiers.thirdPartyMarkup && (
                    <div className="flex justify-between text-sm text-indigo-600">
                      <span>Comisión Terceros (A-07)</span>
                      <span>{formatCurrency(calculatePrices.thirdPartyModifier)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1 w-full shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Inversión Inicial Única</p>
                    <p className="text-3xl font-black text-gray-900">{formatCurrency(calculatePrices.oneTimeTotal)}</p>
                  </div>

                  {calculatePrices.recurringTotal > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex-1 w-full shadow-sm">
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">Inversión Mensual (Retainer)</p>
                      <p className="text-3xl font-black text-purple-900">{formatCurrency(calculatePrices.recurringTotal)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
                <p>Este documento es una estimación generada automáticamente por el sistema CPQ de iStudio.</p>
                <p>Valores expresados en Pesos Chilenos (CLP). Sujetos a confirmación final.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}