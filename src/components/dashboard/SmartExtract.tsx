// ============================================================
// SmartExtract Component
// The primary way to add programs. URL-first, keyword-second.
// Shows streaming progress, then extraction results with
// confidence indicator and missing field warnings.
// ============================================================

'use client';

import { useState, useCallback, useRef } from 'react';
import type { ExtractedProgram, EssayPrompt } from '@/lib/extract/schema';

type ProgressStep = 'idle' | 'resolving' | 'crawling' | 'extracting' | 'complete' | 'error';

interface ProgressEvent {
  step: ProgressStep;
  message: string;
  messageZh: string;
}

interface ExtractResult {
  program: ExtractedProgram;
  crawledPages: Array<{ url: string; pageType: string }>;
  confidence: number;
  missingFields: string[];
  processingTime: number;
}

interface SmartExtractProps {
  lang: 'en' | 'zh';
  onProgramExtracted: (program: ExtractedProgram) => void;
}

export default function SmartExtract({ lang, onProgramExtracted }: SmartExtractProps) {
  const [input, setInput] = useState('');
  const [step, setStep] = useState<ProgressStep>('idle');
  const [progressMessages, setProgressMessages] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const t = lang === 'zh' ? ZH : EN;

  const handleExtract = useCallback(async () => {
    if (!input.trim()) return;

    // Reset state
    setStep('resolving');
    setProgressMessages([]);
    setResult(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const resp = await fetch('/api/smart-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              setStep(data.step);
              setProgressMessages(prev => [...prev, data]);
            } else if (data.type === 'result') {
              setStep('complete');
              setResult(data);
            } else if (data.type === 'error') {
              setStep('error');
              setError(data.message);
            }
          } catch { /* skip malformed events */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setStep('error');
        setError((e as Error).message);
      }
    }
  }, [input]);

  const handleCancel = () => {
    abortRef.current?.abort();
    setStep('idle');
  };

  const handleConfirm = () => {
    if (result?.program) {
      onProgramExtracted(result.program);
      setStep('idle');
      setInput('');
      setResult(null);
    }
  };

  const isProcessing = step !== 'idle' && step !== 'complete' && step !== 'error';

  return (
    <div className="smart-extract">
      {/* Input area */}
      <div className="extract-input-area">
        <div className="extract-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isProcessing && handleExtract()}
            placeholder={t.placeholder}
            disabled={isProcessing}
            className="extract-input"
          />
          {isProcessing ? (
            <button onClick={handleCancel} className="extract-btn cancel">{t.cancel}</button>
          ) : (
            <button onClick={handleExtract} disabled={!input.trim()} className="extract-btn go">
              {t.extract}
            </button>
          )}
        </div>
        <p className="extract-hint">{t.hint}</p>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="extract-progress">
          <div className="progress-steps">
            {(['resolving', 'crawling', 'extracting'] as const).map(s => (
              <div key={s} className={`progress-step ${step === s ? 'active' : ''} ${
                ['resolving', 'crawling', 'extracting'].indexOf(s) < ['resolving', 'crawling', 'extracting'].indexOf(step) ? 'done' : ''
              }`}>
                <div className="step-dot" />
                <span className="step-label">
                  {s === 'resolving' && t.stepResolve}
                  {s === 'crawling' && t.stepCrawl}
                  {s === 'extracting' && t.stepExtract}
                </span>
              </div>
            ))}
          </div>
          <p className="progress-message">
            {progressMessages.length > 0 && (lang === 'zh'
              ? progressMessages[progressMessages.length - 1].messageZh
              : progressMessages[progressMessages.length - 1].message)}
          </p>
        </div>
      )}

      {/* Error */}
      {step === 'error' && error && (
        <div className="extract-error">
          <p>{error}</p>
          <button onClick={() => setStep('idle')} className="extract-btn retry">{t.retry}</button>
        </div>
      )}

      {/* Result preview */}
      {step === 'complete' && result && (
        <div className="extract-result">
          {/* Header */}
          <div className="result-header">
            <div>
              <h3 className="result-school">
                {lang === 'zh' && result.program.schoolNameZh
                  ? result.program.schoolNameZh
                  : result.program.schoolName}
              </h3>
              <h4 className="result-program">
                {lang === 'zh' && result.program.programNameZh
                  ? result.program.programNameZh
                  : result.program.programName}
              </h4>
              <span className="result-degree">{result.program.degree} · {result.program.field}</span>
            </div>
            <div className="result-confidence">
              <div className={`confidence-ring ${
                result.confidence > 0.7 ? 'high' : result.confidence > 0.4 ? 'medium' : 'low'
              }`}>
                {Math.round(result.confidence * 100)}%
              </div>
              <span className="confidence-label">{t.dataCompleteness}</span>
            </div>
          </div>

          {/* Key fields grid */}
          <div className="result-grid">
            <ResultField label={t.deadline} value={result.program.deadlineRegular || result.program.deadlineFinal} />
            <ResultField label={t.toefl} value={result.program.toeflMin ? `≥${result.program.toeflMin}` : null} />
            <ResultField label="GRE" value={result.program.greRequired === true ? t.required : result.program.greRequired === false ? t.notRequired : null} />
            <ResultField label={t.tuition} value={result.program.estimatedTotalTuition ? `$${result.program.estimatedTotalTuition.toLocaleString()}` : null} />
            <ResultField label={t.recs} value={result.program.recsRequired ? `${result.program.recsRequired} ${t.letters}` : null} />
            <ResultField label={t.duration} value={result.program.duration} />
            <ResultField label="WES" value={result.program.wesRequired === true ? result.program.wesEvalType || t.required : result.program.wesRequired === false ? t.notRequired : null} />
            <ResultField label={t.fee} value={result.program.applicationFee ? `$${result.program.applicationFee}` : null} />
          </div>

          {/* Essays */}
          {result.program.essays && result.program.essays.length > 0 && (
            <div className="result-essays">
              <h5>{t.essays} ({result.program.essays.length})</h5>
              {result.program.essays.map((essay: EssayPrompt, i: number) => (
                <div key={i} className="essay-card">
                  <span className="essay-type">{essay.typeZh || essay.type}</span>
                  <p className="essay-prompt">{essay.prompt}</p>
                  {essay.wordLimit && <span className="essay-limit">{essay.wordLimit} {t.words}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Missing fields warning */}
          {result.missingFields.length > 0 && (
            <div className="result-missing">
              <p>{t.missingWarning.replace('{n}', String(result.missingFields.length))}</p>
              <div className="missing-tags">
                {result.missingFields.slice(0, 8).map(f => (
                  <span key={f} className="missing-tag">{f}</span>
                ))}
                {result.missingFields.length > 8 && <span className="missing-tag">+{result.missingFields.length - 8}</span>}
              </div>
            </div>
          )}

          {/* Sources */}
          <div className="result-sources">
            <h5>{t.sources}</h5>
            {result.crawledPages.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="source-link">
                {p.pageType} · {new URL(p.url).pathname}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="result-actions">
            <button onClick={() => { setStep('idle'); setResult(null); }} className="extract-btn secondary">
              {t.discard}
            </button>
            <button onClick={handleConfirm} className="extract-btn primary">
              {t.addToList}
            </button>
          </div>

          <p className="result-time">
            {t.processedIn.replace('{s}', (result.processingTime / 1000).toFixed(1))}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className={`result-field ${!value ? 'missing' : ''}`}>
      <span className="field-label">{label}</span>
      <span className="field-value">{value || '—'}</span>
    </div>
  );
}

// ---- i18n ----

const EN = {
  placeholder: 'Paste program URL or search by name...',
  hint: 'e.g. https://sps.columbia.edu/... or "Columbia strategic communications masters"',
  extract: 'Extract',
  cancel: 'Cancel',
  retry: 'Try again',
  stepResolve: 'Finding program',
  stepCrawl: 'Reading pages',
  stepExtract: 'Extracting data',
  dataCompleteness: 'Data completeness',
  deadline: 'Deadline',
  toefl: 'TOEFL',
  tuition: 'Total tuition',
  recs: 'Recs',
  duration: 'Duration',
  fee: 'App fee',
  essays: 'Essays',
  words: 'words',
  required: 'Required',
  notRequired: 'Not required',
  letters: 'letters',
  missingWarning: '{n} fields could not be extracted — verify manually',
  sources: 'Sources crawled',
  discard: 'Discard',
  addToList: 'Add to my list',
  processedIn: 'Processed in {s}s',
};

const ZH = {
  placeholder: '粘贴项目官网链接，或输入关键词搜索...',
  hint: '例如 https://sps.columbia.edu/... 或 "哥大 战略传播 硕士"',
  extract: '提取',
  cancel: '取消',
  retry: '重试',
  stepResolve: '查找项目',
  stepCrawl: '读取页面',
  stepExtract: '提取数据',
  dataCompleteness: '数据完整度',
  deadline: '截止日期',
  toefl: '托福',
  tuition: '总学费',
  recs: '推荐信',
  duration: '学制',
  fee: '申请费',
  essays: '文书',
  words: '字',
  required: '需要',
  notRequired: '不需要',
  letters: '封',
  missingWarning: '有 {n} 个字段未能提取 — 请手动核实',
  sources: '抓取来源',
  discard: '放弃',
  addToList: '加入我的申请',
  processedIn: '用时 {s} 秒',
};
