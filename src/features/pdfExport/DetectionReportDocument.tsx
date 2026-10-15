import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import type { DetectionReport } from '../../types/detection';
import logoPng from './fonts/integrito-logo-black.png';
import { reportPdfStyles as s } from './reportPdfStyles';
import { buildTextSegments } from './segmentText';

export type DetectionPdfProps = {
  documentText: string;
  report: DetectionReport;
  generatedAt: Date;
};

type ParagraphBlock = {
  text: string;
  start: number;
  end: number;
};

function formatGeneratedOn(date: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatScore(score: number): string {
  return `${score.toFixed(2)}%`;
}

/** Split on blank lines while retaining absolute offsets into the source string. */
function paragraphsWithOffsets(text: string): ParagraphBlock[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const blocks: ParagraphBlock[] = [];
  const re = /\n{2,}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    blocks.push({ text: normalized.slice(last, match.index), start: last, end: match.index });
    last = match.index + match[0].length;
  }
  blocks.push({ text: normalized.slice(last), start: last, end: normalized.length });
  return blocks.filter(b => b.text.length > 0);
}

function DocumentBody({ text, report }: { text: string; report: DetectionReport }) {
  const paragraphs = paragraphsWithOffsets(text);

  return (
    <View>
      {paragraphs.map((paragraph, index) => {
        const localHighlights = report.highlights
          .map(h => ({
            ...h,
            start: Math.max(h.start, paragraph.start) - paragraph.start,
            end: Math.min(h.end, paragraph.end) - paragraph.start,
          }))
          .filter(h => h.end > h.start);

        const segments = buildTextSegments(paragraph.text, localHighlights);

        return (
          <Text key={index} style={s.paragraph} wrap>
            {segments.map((segment, segIndex) =>
              segment.highlighted ? (
                <Text key={segIndex} style={s.highlight}>
                  {segment.text}
                </Text>
              ) : (
                <Text key={segIndex}>{segment.text}</Text>
              ),
            )}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Declarative A4 report — print-friendly light theme regardless of UI theme.
 */
export default function DetectionReportDocument({
  documentText,
  report,
  generatedAt,
}: DetectionPdfProps) {
  const scoreLabel = formatScore(report.score);
  const fillWidth = `${Math.min(100, Math.max(0, report.score))}%`;
  const sourceText = documentText || report.text;
  const isDemo = report.isDemo;

  return (
    <Document
      title="Integrito AI Text Detection Report"
      author="Integrito"
      subject={isDemo ? 'Demo AI detection report (predefined sample)' : 'AI text detection report'}
      creator="Integrito"
      language="en"
    >
      <Page size="A4" style={s.page} wrap>
        <Text
          style={s.pageHeaderLeft}
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? 'Integrito · AI Text Detection Report' : ' '
          }
        />
        <Text
          style={s.pageHeaderRight}
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 && isDemo ? 'Demo report' : ' '
          }
        />
        <Text
          style={s.footerBar}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Integrito · AI Text Detection Report${isDemo ? ' · Demo' : ''} · Page ${pageNumber}${
              totalPages ? ` of ${totalPages}` : ''
            }`
          }
        />

        <View style={s.headerBrand}>
          <Image src={logoPng} style={s.logo} />
        </View>

        <Text style={s.reportTitle}>AI Text Detection Report</Text>
        <Text style={s.metaLabel}>Generated on</Text>
        <Text style={s.metaValue}>{formatGeneratedOn(generatedAt)}</Text>

        {isDemo && (
          <View style={s.demoBanner}>
            <Text style={s.demoTitle}>Demo report</Text>
            <Text style={s.demoBody}>
              Predefined sample data. No AI detection was performed.
            </Text>
          </View>
        )}

        <Text style={s.sectionLabel}>AI Detection Score</Text>
        <View style={s.scoreRow}>
          <Text style={s.scoreValue}>{scoreLabel}</Text>
          <View style={s.scoreDetail}>
            <Text style={s.classification}>{report.classification}</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: fillWidth }]} />
            </View>
          </View>
        </View>

        {report.highlights.length > 0 && (
          <View style={s.legendRow}>
            <View style={s.legendSwatch} />
            <Text style={s.legendText}>Highly likely passages</Text>
          </View>
        )}

        <View style={s.divider} />

        <Text style={s.sectionLabel}>Submitted text</Text>
        {report.documentTitle ? (
          <Text style={s.documentTitle}>{report.documentTitle}</Text>
        ) : null}

        <DocumentBody text={sourceText} report={report} />
      </Page>
    </Document>
  );
}
