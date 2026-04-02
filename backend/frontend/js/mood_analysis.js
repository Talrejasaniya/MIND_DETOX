// mood_analysis.js

// 🚨 NOTE: API_BASE_URL aur getAuthHeader ab script.js se aa rahe hain, 
// yahan dubara likhne ki zaroorat nahi hai (Duplicate error se bacho).

async function initAnalysis() {
    // Safety Check: Pehle dekho ki kya hum sahi page par hain?
    if (document.body.dataset.page !== 'mood_analysis') return;

    try {
        console.log("Aura is fetching analytics...");
        
        // Humne prefix '/analytics' hatau diya tha as per your last update
        const response = await fetch(`${API_BASE_URL}/summary`, {
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("Analysis Data:", data);

        if (!data || !data.moods || Object.keys(data.moods).length === 0) {
            document.getElementById('insight-text').innerText = "Data missing! Dashboard pe mood save kijiye. 🌿";
            return;
        }

        renderCharts(data.moods, data.triggers);
        document.getElementById('insight-text').innerText = "Aura has analyzed your patterns! ✨";
        
    } catch (err) {
        console.error("Analysis failed:", err);
        document.getElementById('insight-text').innerText = "Backend se connection nahi ho paya. ⚠️";
    }
}

function renderCharts(moodData, triggerData) {
    const moodCtx = document.getElementById('moodChart').getContext('2d');
    const triggerCtx = document.getElementById('triggerChart').getContext('2d');
// behavior-list div mein ye HTML inject karo
const commonTrigger = Object.keys(triggerData)[0]; // Sabse bada trigger
document.getElementById('behavior-list').innerHTML = `
    <div class="pattern-item">Most Frequent Trigger: <span>${commonTrigger}</span></div>`;
    // Pie Chart for Moods
    new Chart(moodCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(moodData),
            datasets: [{
                data: Object.values(moodData),
                backgroundColor: ['#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Bar Chart for Triggers
    new Chart(triggerCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(triggerData),
            datasets: [{
                label: 'Total Occurrences',
                data: Object.values(triggerData),
                backgroundColor: '#8B5CF6'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } 
        }
    });
}

// ❌ window.onload hata diya kyunki hum script.js ka router use karenge.