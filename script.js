// เปลี่ยน URL เป็นของ Google Apps Script ของคุณ
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyctRf4nfyco5D5bWAF-fS6n_M8HTRy7fjk__55e8fnI8_FcgeoTGQ1-3xqZJqG72_sZA/exec';

const defaultConfig = {
    project_name: 'THE ELEGANCE',
    tagline: 'LUXURY LIVING REDEFINED',
    hero_title: 'THE ELEGANCE RESIDENCE',
    contact_title: 'ลงทะเบียนรับข้อมูล'
};

let leads = [];

const dataSdkShim = {
    async create(data) {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'create', ...data })
        });
        await refreshData();
        return { isOk: response.ok };
    },
    async update(data) {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update', ...data })
        });
        await refreshData();
        return { isOk: response.ok };
    },
    async delete(data) {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', ...data })
        });
        await refreshData();
        return { isOk: response.ok };
    }
};

async function refreshData() {
    try {
        const response = await fetch(SCRIPT_URL);
        leads = await response.json();
        const countEl = document.getElementById('lead-count');
        if (countEl) countEl.textContent = `${leads.length} รายการ`;
        renderLeads();
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

function renderLeads() {
    const container = document.getElementById('leads-container');
    const noLeads = document.getElementById('no-leads');
    if (!container) return;

    if (leads.length === 0) {
        container.innerHTML = '';
        if (noLeads) noLeads.classList.remove('hidden');
        return;
    }
    if (noLeads) noLeads.classList.add('hidden');

    const sortedLeads = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = sortedLeads.map(lead => `
        <div class="bg-[#1a1a1a] border border-[#c9a961]/20 p-6" data-lead-id="${lead.__backendId}">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-display text-xl text-white truncate">${escapeHtml(lead.name)}</h4>
                        <span class="px-2 py-1 text-xs ${lead.status === 'new' ? 'bg-green-600/20 text-green-400' : lead.status === 'contacted' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}">
                            ${lead.status === 'new' ? 'ใหม่' : lead.status === 'contacted' ? 'ติดต่อแล้ว' : 'ปิดการขาย'}
                        </span>
                    </div>
                    <div class="grid md:grid-cols-3 gap-4 text-sm">
                        <div><span class="text-gray-500">อีเมล:</span> <span class="text-gray-300 ml-2">${escapeHtml(lead.email)}</span></div>
                        <div><span class="text-gray-500">โทร:</span> <span class="text-gray-300 ml-2">${escapeHtml(lead.phone)}</span></div>
                        <div><span class="text-gray-500">ห้อง:</span> <span class="text-[#c9a961] ml-2">${escapeHtml(lead.unit_interest || lead.unit)}</span></div>
                    </div>
                    ${lead.message ? `<p class="text-gray-400 text-sm mt-3 italic">"${escapeHtml(lead.message)}"</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <select onchange="updateLeadStatus('${lead.__backendId}', this.value)" class="bg-[#0a0a0a] border border-[#c9a961]/30 px-3 py-2 text-sm text-white">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>ใหม่</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>ติดต่อแล้ว</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>ปิดการขาย</option>
                    </select>
                    <button onclick="confirmDeleteLead('${lead.__backendId}')" class="text-red-400 hover:text-red-300 p-2">ลบ</button>
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ผูกฟังก์ชันกับหน้าจอ
window.updateLeadStatus = async (id, status) => {
    await dataSdkShim.update({ __backendId: id, status: status });
};

window.confirmDeleteLead = (id) => {
    if(confirm('ยืนยันการลบข้อมูล?')) {
        dataSdkShim.delete({ __backendId: id });
    }
};

// เริ่มต้นทำงานเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    refreshData();
    
    // ตั้งค่า UI
    const navLogo = document.getElementById('nav-logo');
    const heroTagline = document.getElementById('hero-tagline');
    if(navLogo) navLogo.textContent = defaultConfig.project_name;
    if(heroTagline) heroTagline.textContent = defaultConfig.tagline;

    // จัดการการส่งฟอร์ม
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            if(submitBtn) submitBtn.disabled = true;
            
            const leadData = {
                name: document.getElementById('input-name')?.value || '',
                email: document.getElementById('input-email')?.value
