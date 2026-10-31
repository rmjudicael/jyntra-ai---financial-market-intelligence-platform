import { LocalStore } from './storage';
export const WORKFLOW_RUNS_KEY = 'jyntra_v1_workflow_runs';
export type StepStatus = 'idle'|'running'|'success'|'error';
export interface WorkflowStepState { id:string; title:string; status:StepStatus; dataSummary?:string; rawPayload?:any; updatedAt?:number }
export interface WorkflowRun { id:string; userId:string; source:string; symbol:string; timeframe:string; status:'running'|'success'|'error'; analysisId?:string; steps:WorkflowStepState[]; createdAt:number; updatedAt:number; error?:string }
export const CHART_WORKFLOW_STEPS = [
 {id:'reception',title:'Réception du graphique'},{id:'vision',title:'Analyse de l’image'},{id:'market',title:'Récupération des données de marché'},{id:'ai',title:'Analyse IA'},{id:'structures',title:'Détection des structures'},{id:'risk',title:'Analyse du risque'},{id:'annotations',title:'Génération des annotations'},{id:'result',title:'Génération du résultat final'},
];
function emit(){ try{ window.dispatchEvent(new CustomEvent('jyntra_workflow_update')); }catch{} }
export function listWorkflowRuns(userId?:string): WorkflowRun[]{ const all=LocalStore.get<WorkflowRun[]>(WORKFLOW_RUNS_KEY,[]); return userId? all.filter(r=>r.userId===userId): all; }
export function getLatestWorkflowRun(userId:string){ const l=listWorkflowRuns(userId); return l.length? l[l.length-1]: null; }
export function createWorkflowRun(userId:string, symbol:string, timeframe:string, source='chart-analysis'): WorkflowRun{
 const run:WorkflowRun={ id:'wf_'+Date.now().toString(36), userId, source, symbol, timeframe, status:'running', createdAt:Date.now(), updatedAt:Date.now(), steps:CHART_WORKFLOW_STEPS.map(s=>({...s,status:'idle' as StepStatus})) };
 const all=LocalStore.get<WorkflowRun[]>(WORKFLOW_RUNS_KEY,[]); all.push(run); LocalStore.set(WORKFLOW_RUNS_KEY, all.slice(-30)); emit(); return run;
}
export function updateWorkflowStep(runId:string, stepId:string, status:StepStatus, dataSummary?:string, rawPayload?:any){
 const all=LocalStore.get<WorkflowRun[]>(WORKFLOW_RUNS_KEY,[]); const run=all.find(r=>r.id===runId); if(!run) return;
 const st=run.steps.find(s=>s.id===stepId); if(st){ st.status=status; if(dataSummary!==undefined) st.dataSummary=dataSummary; if(rawPayload!==undefined) st.rawPayload=rawPayload; st.updatedAt=Date.now(); }
 run.updatedAt=Date.now(); LocalStore.set(WORKFLOW_RUNS_KEY, all); emit();
}
export function finishWorkflowRun(runId:string, status:'success'|'error', error?:string, analysisId?:string){
 const all=LocalStore.get<WorkflowRun[]>(WORKFLOW_RUNS_KEY,[]); const run=all.find(r=>r.id===runId); if(!run) return;
 run.status=status; if(error) run.error=error; if(analysisId) run.analysisId=analysisId; run.updatedAt=Date.now(); LocalStore.set(WORKFLOW_RUNS_KEY, all); emit();
}
/** Persisted last chart analysis (survives page navigation). */
export const LAST_ANALYSIS_KEY='jyntra_v1_last_chart_analysis';
export function saveChartAnalysisState(v:any){ try{ localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(v)); }catch{} }
export function loadChartAnalysisState():any|null{ try{ const r=localStorage.getItem(LAST_ANALYSIS_KEY); return r? JSON.parse(r):null; }catch{ return null; } }
export function parsePrice(v:any): number|null{ if(typeof v==='number'&&Number.isFinite(v)) return v; if(typeof v==='string'){ const m=v.replace(',','.').match(/-?\d+(\.\d+)?/); return m? parseFloat(m[0]):null; } return null; }
