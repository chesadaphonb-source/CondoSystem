const defaultConfig = {
    project_name: 'THE ELEGANCE',
    tagline: 'LUXURY LIVING REDEFINED',
    hero_title: 'THE ELEGANCE RESIDENCE',
    contact_title: 'ลงทะเบียนรับข้อมูล',
    background_color: '#0a0a0a',
    accent_color: '#c9a961',
    text_color: '#ffffff',
    font_family: 'Cormorant Garamond',
    font_size: 16
};

let leads = [];
let currentRecordCount = 0;

// Data handler for SDK
const dataHandler = {
    onDataChanged(data) {
        leads = data;
        currentRecordCount = data.length;
        renderLeads();
    }
};

// Initialize SDKs
async function initApp() {
    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange: (config) => {
                document.getElementById('nav-logo').textContent = config.project_name || defaultConfig.project_name;
                document.getElementById('hero-tagline').textContent = config.tagline || defaultConfig.tagline;
                document.getElementById('contact-title').textContent = config.contact_title || defaultConfig.contact_title;
            }
        });
    }

    if (window.dataSdk) {
        await window.dataSdk.init(dataHandler);
    }
}

// Render leads list
function renderLeads() {
    const container = document.getElementById('leads-container');
    const noLeads = document.getElementById('no-leads');
    const leadCount = document.getElementById('lead-count');
    
    leadCount.textContent = `${leads.length} รายการ`;

    if (leads.length === 0) {
        container.innerHTML = '';
        noLeads.classList.remove('hidden');
        return;
    }

    noLeads.classList.add('hidden');
    const sortedLeads = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = sortedLeads.map(lead => `
        <div class="bg-[#1a1a1a] border border-[#c9a961]/20 p-6" data-lead-id="${lead.__backendId}">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1">
                    <h4 class="font-display text-xl text-white">${escapeHtml(lead.name)}</h4>
                    <p class="text-gray-400 text-sm">${escapeHtml(lead.email)} | ${escapeHtml(lead.phone)}</p>
                    <p class="text-[#c9a961] text-sm mt-1">ห้องที่สนใจ: ${escapeHtml(lead.unit_interest)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <select onchange="updateLeadStatus('${lead.__backendId}', this.value)" class="bg-[#0a0a0a] border border-[#c9a961]/30 text-xs p-1">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>ใหม่</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>ติดต่อแล้ว</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>ปิดการขาย</option>
                    </select>
                    <button onclick="confirmDeleteLead('${lead.__backendId}')" class="text-red-400">ลบ</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle Form Submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;

    const leadData = {
        name: document.getElementById('input-name').value,
        email: document.getElementById('input-email').value,
        phone: document.getElementById('input-phone').value,
        unit_interest: document.getElementById('input-unit').value || 'ยังไม่ระบุ',
        created_at: new Date().toISOString(),
        status: 'new'
    };

    if (window.dataSdk) {
        const result = await window.dataSdk.create(leadData);
        if (result.isOk) {
            showToast('ลงทะเบียนสำเร็จ');
            e.target.reset();
        }
    }
    submitBtn.disabled = false;
});

// Utility Functions
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast px-6 py-4 rounded bg-green-600 text-white`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleAdmin() {
    document.getElementById('admin-section').classList.toggle('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectUnit(unitName) {
    document.getElementById('input-unit').value = unitName;
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// Start App
initApp();
