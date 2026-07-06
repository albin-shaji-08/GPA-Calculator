// analytics.js — GPA Progression Chart & PDF Print Module

/**
 * Render the GPA Progression bar chart on the dashboard.
 * Called from updateUI() in app.js.
 */
function renderGpaChart() {
    const chartBars = document.getElementById('gpa-chart-bars');
    if (!chartBars) return;

    // Update Y-axis labels based on current max scale
    const yAxis = document.querySelector('.chart-y-axis');
    if (yAxis) {
        const maxVal = state.maxGpaScale;
        yAxis.innerHTML = `
            <span>${maxVal.toFixed(1)}</span>
            <span>${(maxVal * 0.75).toFixed(1)}</span>
            <span>${(maxVal * 0.5).toFixed(1)}</span>
            <span>${(maxVal * 0.25).toFixed(1)}</span>
            <span>0.0</span>
        `;
    }

    if (state.semesters.length === 0) {
        chartBars.innerHTML = `<div class="chart-placeholder">Add semesters to see your progress chart!</div>`;
        return;
    }

    chartBars.innerHTML = '';

    state.semesters.forEach(sem => {
        const gpa = calculateSemesterGPA(sem);
        const heightPercent = (gpa / state.maxGpaScale) * 100;

        const barGroup = document.createElement('div');
        barGroup.className = 'chart-bar-group';

        const barTrack = document.createElement('div');
        barTrack.className = 'chart-bar-track';

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = Math.min(100, Math.max(2, heightPercent)) + '%';

        const tooltip = document.createElement('div');
        tooltip.className = 'chart-bar-tooltip';
        tooltip.textContent = `${sem.name}: ${gpa.toFixed(2)}`;

        bar.appendChild(tooltip);
        barTrack.appendChild(bar);

        const label = document.createElement('div');
        label.className = 'chart-bar-label';
        label.textContent = sem.name;

        barGroup.appendChild(barTrack);
        barGroup.appendChild(label);
        chartBars.appendChild(barGroup);
    });
}

/**
 * Print semester and course results as a clean B&W PDF.
 * Uses a hidden iframe with print-friendly HTML.
 */
function printResults() {
    const { cgpa, totalCredits } = calculateCGPA();
    const classText = getCgpaClass(cgpa);

    let semestersHtml = '';

    state.semesters.forEach((sem, idx) => {
        const semGpa = calculateSemesterGPA(sem);
        let coursesRows = '';

        sem.courses.forEach((course, cIdx) => {
            const gradeConfig = state.gradingScale.find(g => g.letter === course.grade);
            const points = gradeConfig ? gradeConfig.points : 0;
            const credits = parseFloat(course.credits) || 0;

            coursesRows += `
                <tr>
                    <td>${cIdx + 1}</td>
                    <td>${course.name || '(Unnamed)'}</td>
                    <td style="text-align:center;">${credits}</td>
                    <td style="text-align:center;">${course.grade}</td>
                    <td style="text-align:center;">${points.toFixed(1)}</td>
                    <td style="text-align:center;">${(points * credits).toFixed(2)}</td>
                </tr>
            `;
        });

        const totalSemCredits = sem.courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

        semestersHtml += `
            <div class="semester-block">
                <h2>${sem.name}</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th>Subject</th>
                            <th style="width:70px;text-align:center;">Credits</th>
                            <th style="width:70px;text-align:center;">Grade</th>
                            <th style="width:80px;text-align:center;">Points</th>
                            <th style="width:100px;text-align:center;">Cr × Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coursesRows}
                    </tbody>
                </table>
                <div class="sem-summary">
                    <span>Credits: <strong>${totalSemCredits}</strong></span>
                    <span>Semester GPA: <strong>${semGpa.toFixed(2)}</strong></span>
                </div>
            </div>
        `;
    });

    const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>GPA Report</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Lexend:wght@300;400;500;700&display=swap');

            * { margin: 0; padding: 0; box-sizing: border-box; }

            body {
                font-family: 'Lexend', sans-serif;
                color: #000;
                background: #fff;
                padding: 2rem;
                font-size: 12px;
            }

            h1 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 22px;
                text-transform: uppercase;
                border-bottom: 3px solid #000;
                padding-bottom: 0.5rem;
                margin-bottom: 0.5rem;
            }

            .report-meta {
                display: flex;
                justify-content: space-between;
                border: 2px solid #000;
                padding: 0.75rem 1rem;
                margin-bottom: 1.5rem;
                font-size: 13px;
            }

            .report-meta span { font-weight: 500; }
            .report-meta strong { font-weight: 700; }

            .semester-block {
                margin-bottom: 1.5rem;
                page-break-inside: avoid;
            }

            .semester-block h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 15px;
                text-transform: uppercase;
                background: #000;
                color: #fff;
                padding: 0.4rem 0.75rem;
                margin-bottom: 0;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000;
            }

            th, td {
                border: 1px solid #000;
                padding: 0.4rem 0.6rem;
                font-size: 11px;
            }

            th {
                background: #eee;
                font-family: 'Space Grotesk', sans-serif;
                text-transform: uppercase;
                font-size: 10px;
                font-weight: 700;
            }

            tbody tr:nth-child(even) { background: #f9f9f9; }

            .sem-summary {
                display: flex;
                justify-content: flex-end;
                gap: 2rem;
                border: 2px solid #000;
                border-top: none;
                padding: 0.4rem 0.75rem;
                font-size: 12px;
                background: #eee;
            }

            .footer-note {
                margin-top: 2rem;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 0.75rem;
            }

            @media print {
                body { padding: 0.5cm; }
                .semester-block { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <h1>GPA Calculator — Results Report</h1>
        <div class="report-meta">
            <span>Cumulative CGPA: <strong>${cgpa.toFixed(2)}</strong>${classText ? ` (${classText})` : ''}</span>
            <span>Total Credits: <strong>${totalCredits}</strong></span>
            <span>Semesters: <strong>${state.semesters.length}</strong></span>
            <span>Scale: <strong>${state.maxGpaScale.toFixed(1)}</strong></span>
        </div>
        ${semestersHtml}
        <div class="footer-note">
            Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; GPA Calculator by Albin Shaji
        </div>
    </body>
    </html>
    `;

    // Open print dialog using a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    // Wait for fonts to load, then print
    iframe.contentWindow.onload = () => {
        setTimeout(() => {
            iframe.contentWindow.print();
            // Clean up after print dialog closes
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };
}
