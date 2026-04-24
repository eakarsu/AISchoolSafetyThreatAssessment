import React from 'react';
import { FaRobot, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';

function AIResponseDisplay({ response, loading }) {
  if (loading) {
    return (
      <div className="ai-response-container">
        <div className="ai-response-header">
          <FaRobot className="ai-icon" />
          AI Analysis in Progress
        </div>
        <div className="ai-loading">
          <span>Analyzing data</span>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  const text = typeof response === 'object' ? (response.analysis || response.result || response.response || response.message || JSON.stringify(response, null, 2)) : String(response);

  const formatResponse = (raw) => {
    const sections = [];
    const lines = raw.split('\n');
    let currentSection = { title: '', items: [] };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect section headers (numbered like "1." or "##" or all caps or ending with ":")
      const isHeader = /^#{1,3}\s+/.test(trimmed) ||
        /^\d+\.\s+[A-Z]/.test(trimmed) ||
        (/^[A-Z][A-Z\s&]+:?$/.test(trimmed) && trimmed.length < 60) ||
        /^[A-Z][a-zA-Z\s]+:$/.test(trimmed);

      if (isHeader) {
        if (currentSection.title || currentSection.items.length) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').replace(/:$/, ''),
          items: [],
        };
      } else {
        const cleaned = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        currentSection.items.push(cleaned);
      }
    }
    if (currentSection.title || currentSection.items.length) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({ title: '', items: [raw] });
    }

    return sections;
  };

  const colorCodeRisk = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('critical')) return 'risk-critical';
    if (lower.includes('high') && (lower.includes('risk') || lower.includes('level') || lower.includes('severity'))) return 'risk-high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'risk-medium';
    if (lower.includes('low') && (lower.includes('risk') || lower.includes('level') || lower.includes('severity'))) return 'risk-low';
    return '';
  };

  const getSectionIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('risk') || lower.includes('threat') || lower.includes('danger')) return <FaExclamationCircle style={{ color: '#ef4444' }} />;
    if (lower.includes('recommend') || lower.includes('action') || lower.includes('solution')) return <FaCheckCircle style={{ color: '#22c55e' }} />;
    if (lower.includes('protect') || lower.includes('safe') || lower.includes('security')) return <FaShieldAlt style={{ color: '#3b82f6' }} />;
    return <FaInfoCircle style={{ color: '#8b5cf6' }} />;
  };

  const sections = formatResponse(text);

  return (
    <div className="ai-response-container">
      <div className="ai-response-header">
        <FaRobot className="ai-icon" />
        AI Analysis Results
      </div>
      <div className="ai-response-body">
        {sections.map((section, idx) => {
          const riskClass = colorCodeRisk(section.title);
          return (
            <div className="ai-response-section" key={idx}>
              {section.title && (
                <h4>
                  {getSectionIcon(section.title)}
                  {section.title}
                  {riskClass && <span className={`risk-level ${riskClass}`}>{section.title.match(/critical|high|medium|moderate|low/i)?.[0]}</span>}
                </h4>
              )}
              {section.items.length === 1 && !section.title ? (
                <p>{section.items[0]}</p>
              ) : (
                <ul>
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AIResponseDisplay;
