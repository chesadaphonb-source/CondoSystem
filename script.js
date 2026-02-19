// 1. Configuration & Global Variables
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzi7FMNzo9mx6BJY4efcFXaT_hoLn5EcSUb0sVThVGEnujjTSTAyPvFgxc2hsygVfqWrA/exec';

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

// 2. Initialize App
async function initApp() {
    // แอนิเมชันตอนเริ่ม (ถ้ามี SDK)
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
    // ดึงข้อมูลจาก Sheets ทันทีที่โหลดหน้าเว็บ
    refreshData();
}

// 3. Data Core Functions (เชื่อมต่อ Google Sheets)

// ดึงข้อมูลทั้งหมด
async function refreshData() {
    try {
        const response = await fetch(SCRIPT_URL);
        leads = await response.json();
        renderLeads();
    } catch (e) {
        console.error("Fetch error:", e);
        // showToast('ไม่สามารถดึงข้อมูลได้', 'error');
    }
}

// ส่งข้อมูลใหม่ (Create)
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>กำลังส่งข้อมูล...</span>';

    const leadData = {
        action: 'create',
        name: document.getElementById('input-name').value,
        email: document.getElementById('input-email').value,
        phone: document.getElementById('input-phone').value,
        unit_interest: document.getElementById('input-unit').value || 'ยังไม่ระบุ',
        budget: document.getElementById('input-budget') ? document.getElementById('input-budget').value : 'ยังไม่ระบุ',
        message: document.getElementById('input-message') ? document.getElementById('input-message').value : '',
        created_at: new Date().toISOString(),
        status: 'new'
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(leadData)
        });
        const result = await response.json();
        
        if (result.isOk) {
            showToast('ลงทะเบียนสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด');
            e.target.reset();
            refreshData(); // อัปเดตรายการในหน้า Admin
        }
    } catch (error) {
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ส่งข้อมูล</span>';
    }
});

// อัปเดตสถานะ (Update)
async function updateLeadStatus(backendId, newStatus) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                __backendId: backendId,
                status: newStatus
            })
        });
        const result = await response.json();
        if (result.isOk) {
            showToast('อัปเดตสถานะเรียบร้อย');
            refreshData();
        }
    } catch (e) {
        showToast('อัปเดตไม่สำเร็จ', 'error');
    }
}

// ยืนยันการลบ (Delete)
let deleteConfirmId = null;
function confirmDeleteLead(backendId) {
    if (deleteConfirmId === backendId) {
        deleteLead(backendId);
        deleteConfirmId = null;
    } else {
        deleteConfirmId = backendId;
        showToast('คลิก "ลบ" อีกครั้งเพื่อยืนยัน', 'error');
        setTimeout(() => { deleteConfirmId = null; }, 3000);
    }
}

async function deleteLead(backendId) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                __backendId: backendId
            })
        });
        const result = await response.json();
        if (result.isOk) {
            showToast('ลบข้อมูลเรียบร้อย');
            refreshData();
        }
    } catch (e) {
        showToast('ลบไม่สำเร็จ', 'error');
    }
}

// 4. UI Rendering
function renderLeads() {
    const container = document.getElementById('leads-container');
    const noLeads = document.getElementById('no-leads');
    const leadCount = document.getElementById('lead-count');
    
    if (leadCount) leadCount.textContent = `${leads.length} รายการ`;

    if (!leads || leads.length === 0) {
        container.innerHTML = '';
        if (noLeads) noLeads.classList.remove('hidden');
        return;
    }

    if (noLeads) noLeads.classList.add('hidden');
    const sortedLeads = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = sortedLeads.map(lead => `
        <div class="bg-[#1a1a1a] border border-[#c9a961]/20 p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex-1">
                    <h4 class="font-display text-xl text-white">${escapeHtml(lead.name)}</h4>
                    <p class="text-gray-400 text-sm">${escapeHtml(lead.email)} | ${escapeHtml(lead.phone)}</p>
                    <p class="text-[#c9a961] text-sm mt-1">ห้องที่สนใจ: ${escapeHtml(lead.unit_interest)}</p>
                    <p class="text-gray-500 text-xs mt-2 italic">${new Date(lead.created_at).toLocaleString('th-TH')}</p>
                </div>
                <div class="flex items-center gap-2">
                    <select onchange="updateLeadStatus('${lead.__backendId}', this.value)" class="bg-[#0a0a0a] border border-[#c9a961]/30 text-xs p-1 text-white">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>ใหม่</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>ติดต่อแล้ว</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>ปิดการขาย</option>
                    </select>
                    <button onclick="confirmDeleteLead('${lead.__backendId}')" class="text-red-400 hover:text-red-300 transition-colors ml-2 text-sm">ลบ</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 5. Helper Functions
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast px-6 py-4 rounded shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleAdmin() {
    const admin = document.getElementById('admin-section');
    if (admin) {
        admin.classList.toggle('hidden');
        if (!admin.classList.contains('hidden')) admin.scrollIntoView({ behavior: 'smooth' });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectUnit(unitName) {
    const unitInput = document.getElementById('input-unit');
    if (unitInput) unitInput.value = unitName;
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// Run
initApp();
