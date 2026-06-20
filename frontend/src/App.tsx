import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { GraphCanvas } from './components/GraphCanvas';
import { Inspector } from './components/Inspector';
import { AddServiceModal } from './components/Modals/AddServiceModal';
import { AddDependencyModal } from './components/Modals/AddDependencyModal';
import { Service, Dependency, SimulationRun, SimulationResult } from './types';
import { api } from './api';
import { Plus, Link2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [simulationHistory, setSimulationHistory] = useState<SimulationRun[]>([]);

  // Simulation states
  const [initialFailedServiceIds, setInitialFailedServiceIds] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Selection state
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');

  // Modals state
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddDependencyOpen, setIsAddDependencyOpen] = useState(false);

  // Global states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // 1. Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, dependenciesData, historyData] = await Promise.all([
        api.getServices(),
        api.getDependencies(),
        api.getSimulationHistory(),
      ]);
      setServices(servicesData);
      setDependencies(dependenciesData);
      setSimulationHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data from backend. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show a temporary feedback message
  const showFeedback = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // 2. Trigger failure simulation whenever initial failures change
  const runFailureSimulation = async (failedIds: string[]) => {
    if (failedIds.length === 0) {
      setSimulationResult(null);
      return;
    }

    try {
      const results = await api.runSimulation(failedIds);
      setSimulationResult(results);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to calculate failure simulation', 'error');
    }
  };

  // Toggle failure trigger on a service
  const handleToggleFailure = (serviceId: string) => {
    const updatedFailures = initialFailedServiceIds.includes(serviceId)
      ? initialFailedServiceIds.filter((id) => id !== serviceId)
      : [...initialFailedServiceIds, serviceId];

    setInitialFailedServiceIds(updatedFailures);
    runFailureSimulation(updatedFailures);
  };

  // Clear simulation
  const handleClearSimulation = () => {
    setInitialFailedServiceIds([]);
    setSimulationResult(null);
    showFeedback('Simulation cleared. All services restored to healthy.', 'success');
  };

  // Save current simulation scenario to history
  const handleSaveSimulation = async (name: string) => {
    try {
      const savedRun = await api.saveSimulation(name, initialFailedServiceIds);
      setSimulationHistory((prev) => [savedRun, ...prev]);
      showFeedback(`Outage scenario '${name}' saved successfully.`, 'success');
    } catch (err: any) {
      throw err; // Re-throw to be handled in the Sidebar component
    }
  };

  // Load a historical simulation
  const handleLoadSimulationRun = (run: SimulationRun) => {
    setInitialFailedServiceIds(run.initialFailedServiceIds);
    setSimulationResult(run.results);
    showFeedback(`Loaded scenario: ${run.name}`, 'success');
  };

  // Create a dependency between nodes visually (drag and drop)
  const handleConnectEdges = async (sourceId: string, targetId: string) => {
    try {
      // By default create a HARD connection
      const newDep = await api.createDependency({
        dependentId: sourceId,
        dependencyId: targetId,
        type: 'HARD',
      });

      setDependencies((prev) => [...prev, newDep]);

      // Update the services list locally to reflect the connection in parent state immediately
      setServices((prevServices) =>
        prevServices.map((service) => {
          if (service.id === sourceId) {
            return {
              ...service,
              dependencies: [...(service.dependencies || []), { id: newDep.id, dependencyId: targetId, type: 'HARD' }],
            };
          }
          if (service.id === targetId) {
            return {
              ...service,
              dependents: [...(service.dependents || []), { id: newDep.id, dependentId: sourceId, type: 'HARD' }],
            };
          }
          return service;
        })
      );

      showFeedback('Dependency established successfully', 'success');

      // If we are currently simulating, re-run simulation to include the new edge
      if (initialFailedServiceIds.length > 0) {
        runFailureSimulation(initialFailedServiceIds);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create dependency connection', 'error');
    }
  };

  // Callback when a service is deleted from Inspector
  const handleServiceDeleted = (deletedId: string) => {
    if (selectedServiceId === deletedId) {
      setSelectedServiceId(null);
    }

    // Remove service from states locally
    setServices((prev) => prev.filter((s) => s.id !== deletedId));
    setDependencies((prev) => prev.filter((d) => d.dependentId !== deletedId && d.dependencyId !== deletedId));

    // Remove from initial failures list if it was there
    const updatedFailures = initialFailedServiceIds.filter((id) => id !== deletedId);
    setInitialFailedServiceIds(updatedFailures);

    showFeedback('Service deleted successfully', 'success');

    // Re-run simulation
    runFailureSimulation(updatedFailures);
  };

  // Callback when a service is updated from Inspector
  const handleServiceUpdated = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? { ...s, ...updatedService } : s))
    );
    showFeedback(`Service '${updatedService.name}' updated successfully.`, 'success');

    // Re-run simulation if we are currently simulating
    if (initialFailedServiceIds.length > 0) {
      runFailureSimulation(initialFailedServiceIds);
    }
  };



  // 3. Filter services to display on the graph
  // If query/filter is active, we highlight or filter the list
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Criticality filter
      const matchesCrit = criticalityFilter ? s.criticality === criticalityFilter : true;

      // Status filter
      let matchesStatus = true;
      if (statusFilter) {
        const nodeStatus = simulationResult?.nodes[s.id]?.status || 'HEALTHY';
        matchesStatus = nodeStatus === statusFilter;
      }

      return matchesSearch && matchesCrit && matchesStatus;
    });
  }, [services, searchQuery, statusFilter, criticalityFilter, simulationResult]);

  // Selected service detailed object lookup
  const selectedServiceObject = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Selected service simulation result node lookup
  const selectedNodeResult = useMemo(() => {
    if (!simulationResult || !selectedServiceId) return null;
    return simulationResult.nodes[selectedServiceId] || null;
  }, [simulationResult, selectedServiceId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>

      {/* Toast Notification Banner */}
      {feedbackMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            padding: '12px 24px',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: feedbackMessage.type === 'success'
              ? 'rgba(16, 185, 129, 0.9)'
              : (feedbackMessage.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)'),
            border: `1px solid ${feedbackMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.2)'
                : (feedbackMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)')
              }`,
            transition: 'all 0.3s ease',
          }}
        >
          {feedbackMessage.type === 'success' && <ShieldCheck size={16} />}
          {feedbackMessage.type === 'error' && <AlertTriangle size={16} />}
          {feedbackMessage.type === 'warning' && <HelpCircle size={16} />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Loading & Error Screens */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-healthy)', borderRadius: '50%', animation: 'flow 1s linear infinite' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Workspace Graph...</h2>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--color-failed)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Connection Failure</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border-hover)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Panel: Sidebar controls */}
          <Sidebar
            services={services}
            simulationResult={simulationResult}
            initialFailedServiceIds={initialFailedServiceIds}
            simulationHistory={simulationHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            criticalityFilter={criticalityFilter}
            setCriticalityFilter={setCriticalityFilter}
            onToggleFailure={handleToggleFailure}
            onClearSimulation={handleClearSimulation}
            onSaveSimulation={handleSaveSimulation}
            onLoadSimulationRun={handleLoadSimulationRun}
          />

          {/* Center Area: React Flow Canvas & Header Buttons */}
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {/* Upper Action Bar */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10,
                display: 'flex',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setIsAddServiceOpen(true)}
                style={{
                  background: 'rgba(16, 22, 34, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Plus size={14} color="var(--color-healthy)" />
                <span>New Service</span>
              </button>

              <button
                onClick={() => setIsAddDependencyOpen(true)}
                disabled={services.length < 2}
                style={{
                  background: 'rgba(16, 22, 34, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: services.length < 2 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  opacity: services.length < 2 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (services.length >= 2) {
                    e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (services.length >= 2) {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <Link2 size={14} color="var(--color-degraded)" />
                <span>Link Dependency</span>
              </button>
            </div>

            {/* React Flow Workspace */}
            <GraphCanvas
              services={filteredServices}
              dependencies={dependencies}
              simulationResult={simulationResult}
              initialFailedServiceIds={initialFailedServiceIds}
              selectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
              onToggleFailure={handleToggleFailure}
              onConnectEdges={handleConnectEdges}
            />
          </div>

          {/* Right Panel: Selected node details */}
          <Inspector
            selectedService={selectedServiceObject}
            simulationNodeResult={selectedNodeResult}
            services={services}
            onClose={() => setSelectedServiceId(null)}
            onServiceDeleted={handleServiceDeleted}
            onServiceUpdated={handleServiceUpdated}
          />

          {/* Modals */}
          <AddServiceModal
            isOpen={isAddServiceOpen}
            onClose={() => setIsAddServiceOpen(false)}
            onSuccess={(newService) => {
              setServices((prev) => [...prev, { ...newService, dependencies: [], dependents: [] }]);
              showFeedback(`Service '${newService.name}' added successfully.`, 'success');
            }}
          />

          <AddDependencyModal
            isOpen={isAddDependencyOpen}
            onClose={() => setIsAddDependencyOpen(false)}
            services={services}
            onSuccess={(newDep) => {
              setDependencies((prev) => [...prev, newDep]);

              // Update services state locally to include the new dependency
              setServices((prevServices) =>
                prevServices.map((service) => {
                  if (service.id === newDep.dependentId) {
                    return {
                      ...service,
                      dependencies: [...(service.dependencies || []), { id: newDep.id, dependencyId: newDep.dependencyId, type: newDep.type }],
                    };
                  }
                  if (service.id === newDep.dependencyId) {
                    return {
                      ...service,
                      dependents: [...(service.dependents || []), { id: newDep.id, dependentId: newDep.dependentId, type: newDep.type }],
                    };
                  }
                  return service;
                })
              );

              showFeedback('Dependency relation added successfully.', 'success');

              // If simulating, re-run simulation to include the new connection
              if (initialFailedServiceIds.length > 0) {
                runFailureSimulation(initialFailedServiceIds);
              }
            }}
          />

        </div>
      )}
    </div>
  );
}

export default App;
