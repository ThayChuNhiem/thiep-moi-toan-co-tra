/**
 * Single Page Application - Invitation Card Generator & Automatic Google Sheets RSVP Sync
 * Event: "Giao hưởng của những ước mơ" - Hệ Thống Toán Cô Trà
 */

// Fixed Google Sheets Webhook URL provided by User
const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxKt5PGe-2087wxYyFR24G0PIpBe7CxJ54-D6ek1EagUJFLLt7TDJpGiAtKEpcnWeegAg/exec';

// Application State
const appState = {
  parentName: 'Nguyễn Văn B',
  childName: 'Nguyễn Văn A',
  attendance: 'Con sẽ tham gia cùng Bố/Mẹ',
  imageDataUrl: null,
  exportedImageBase64: null,
  logoClickCount: 0,
  isAdminUnlocked: false
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
  updateCardDOM();
});

/**
 * Update DOM Elements on the Invitation Card Canvas
 */
function updateCardDOM() {
  document.getElementById('cardParentName').textContent = appState.parentName;
  document.getElementById('cardChildName').textContent = appState.childName;

  const photoImg = document.getElementById('cardPhotoImg');
  const photoSpan = document.getElementById('photoPlaceholderSpan');

  if (appState.imageDataUrl) {
    photoImg.src = appState.imageDataUrl;
    photoImg.classList.remove('hidden');
    if (photoSpan) photoSpan.classList.add('hidden');
  } else {
    photoImg.src = '';
    photoImg.classList.add('hidden');
    if (photoSpan) photoSpan.classList.remove('hidden');
  }
}

/**
 * Real-time Input Handlers
 */
function handleRealtimeParentName(value) {
  appState.parentName = value.trim() || 'Nguyễn Văn B';
  document.getElementById('cardParentName').textContent = appState.parentName;
}

function handleRealtimeChildName(value) {
  appState.childName = value.trim() || 'Nguyễn Văn A';
  document.getElementById('cardChildName').textContent = appState.childName;
}

function handleRealtimeAttendance(value) {
  appState.attendance = value;
  selectAttendanceOption(value);
}

/**
 * Radio Pill Buttons Selection Handler
 */
function selectAttendanceOption(optionText) {
  appState.attendance = optionText;

  const btn1 = document.getElementById('btnAttendance1');
  const btn2 = document.getElementById('btnAttendance2');
  const btn3 = document.getElementById('btnAttendance3');

  [btn1, btn2, btn3].forEach(btn => {
    if (!btn) return;
    if (btn.textContent.trim().includes(optionText) || optionText.includes(btn.textContent.trim())) {
      btn.className = 'attendance-pill-btn gold-active';
    } else {
      btn.className = 'attendance-pill-btn purple-passive';
    }
  });

  const inputAtt = document.getElementById('inputAttendance');
  if (inputAtt) inputAtt.value = optionText;

  // Auto post to Webhook when user selects attendance option directly on main page
  saveSubmissionToDatabase({
    childName: appState.childName,
    parentName: appState.parentName,
    attendance: appState.attendance,
    timestamp: new Date().toLocaleString('vi-VN'),
    photo: appState.imageDataUrl
  });
}

/**
 * Logo Click Secret Admin Trigger
 */
function handleLogoClick() {
  appState.logoClickCount++;
  if (appState.logoClickCount >= 3) {
    appState.logoClickCount = 0;
    openAdminModal();
  }
}

/**
 * Modal Controls
 */
function openGuideModal() {
  document.getElementById('guideModal').classList.add('open');
}

function closeGuideModal() {
  document.getElementById('guideModal').classList.remove('open');
}

function openInputModal() {
  document.getElementById('inputParentName').value = appState.parentName;
  document.getElementById('inputChildName').value = appState.childName;
  document.getElementById('inputAttendance').value = appState.attendance;

  document.getElementById('inputModal').classList.add('open');
}

function closeInputModal() {
  document.getElementById('inputModal').classList.remove('open');
}

function openResultModal() {
  document.getElementById('resultModal').classList.add('open');
}

function closeResultModal() {
  document.getElementById('resultModal').classList.remove('open');
}

function openAdminModal() {
  document.getElementById('adminModal').classList.add('open');
  if (appState.isAdminUnlocked) {
    renderAdminDashboard();
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('open');
}

/**
 * Admin PIN Verification
 */
function verifyAdminPin() {
  const pin = document.getElementById('adminPinInput').value.trim();
  if (pin === '123456' || pin === 'admin') {
    appState.isAdminUnlocked = true;
    document.getElementById('adminPinArea').classList.add('hidden');
    document.getElementById('adminDashboardContent').classList.remove('hidden');
    renderAdminDashboard();
  } else {
    alert('Mã PIN không đúng. Vui lòng thử lại.');
  }
}

/**
 * Drag & Drop Image Upload
 */
function initDragAndDrop() {
  const dropZone = document.getElementById('dragDropArea');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  });
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    processImageFile(files[0]);
  }
}

/**
 * High-Performance Client-Side Image Resizing
 */
function processImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      appState.imageDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      updateCardDOM();

      const modalPreviewImg = document.getElementById('modalPreviewImg');
      const modalPreviewContainer = document.getElementById('modalImagePreviewContainer');
      const uploadPrompt = document.getElementById('uploadPrompt');

      modalPreviewImg.src = appState.imageDataUrl;
      modalPreviewContainer.classList.remove('hidden');
      uploadPrompt.classList.add('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Form Submit: Save to Local DB + Sync to Fixed Google Sheets Webhook
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  closeInputModal();
  showLoadingOverlay();

  saveSubmissionToDatabase({
    childName: appState.childName,
    parentName: appState.parentName,
    attendance: appState.attendance,
    timestamp: new Date().toLocaleString('vi-VN'),
    photo: appState.imageDataUrl
  });

  setTimeout(async () => {
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const cardElement = document.getElementById('invitationCard');
      
      const canvas = await html2canvas(cardElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFDF7',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 480,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('invitationCard');
          if (clonedCard) {
            clonedCard.style.width = '440px';
            clonedCard.style.maxWidth = '440px';
            clonedCard.style.margin = '0 auto';
            clonedCard.style.boxShadow = 'none';
            clonedCard.style.transform = 'none';
            clonedCard.style.padding = '16px';
          }
        }
      });

      appState.exportedImageBase64 = canvas.toDataURL('image/png', 1.0);
      document.getElementById('exportedCardImage').src = appState.exportedImageBase64;

      hideLoadingOverlay();
      openResultModal();

    } catch (error) {
      console.error('Lỗi tạo thiệp:', error);
      hideLoadingOverlay();
      alert('Không thể tự động xuất ảnh. Bạn có thể chụp màn hình thiệp để lưu lại.');
    }
  }, 250);
}

/**
 * Database RSVP Saver & Automatic Sync to Fixed Google Sheets Webhook
 */
function saveSubmissionToDatabase(data) {
  // Save to LocalStorage
  const rsvps = JSON.parse(localStorage.getItem('toanCoTra_RSVPs') || '[]');
  rsvps.unshift(data);
  localStorage.setItem('toanCoTra_RSVPs', JSON.stringify(rsvps));

  // Automatic Async Post to Fixed Google Sheets Webhook
  if (GOOGLE_SHEET_WEBHOOK_URL) {
    try {
      fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        mode: 'no-cors'
      }).catch(err => console.log('Google Sheets Webhook Sync Notice:', err));
    } catch (e) {
      console.log('Webhook error:', e);
    }
  }
}

/**
 * Admin Dashboard Render
 */
function renderAdminDashboard() {
  const rsvps = JSON.parse(localStorage.getItem('toanCoTra_RSVPs') || '[]');

  document.getElementById('statTotal').textContent = rsvps.length;
  
  const withParents = rsvps.filter(r => r.attendance.includes('cùng Bố/Mẹ')).length;
  const childOnly = rsvps.filter(r => r.attendance.includes('Chỉ mình con')).length;

  document.getElementById('statWithParents').textContent = withParents;
  document.getElementById('statChildOnly').textContent = childOnly;

  const tableBody = document.getElementById('adminTableBody');
  tableBody.innerHTML = '';

  if (rsvps.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-[#7E6388] text-xs">Chưa có thông tin phụ huynh điểm danh</td></tr>`;
    return;
  }

  rsvps.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    tr.innerHTML = `
      <td class="p-2 font-bold text-[#3D2B3D]">${item.childName}</td>
      <td class="p-2 text-gray-600">${item.parentName}</td>
      <td class="p-2">
        <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold ${item.attendance.includes('cùng Bố/Mẹ') ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}">
          ${item.attendance}
        </span>
      </td>
      <td class="p-2 text-right">
        ${item.photo ? `<button onclick="viewAdminPhoto('${index}')" class="text-xs text-[#C59242] underline">Xem ảnh</button>` : '<span class="text-gray-300">Không có</span>'}
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function viewAdminPhoto(index) {
  const rsvps = JSON.parse(localStorage.getItem('toanCoTra_RSVPs') || '[]');
  const item = rsvps[index];
  if (item && item.photo) {
    const w = window.open('');
    w.document.write(`<img src="${item.photo}" style="max-width: 100%; border-radius: 12px; margin: 20px auto; display: block;"/>`);
  }
}

function clearAllAdminData() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách điểm danh hiện tại?')) {
    localStorage.removeItem('toanCoTra_RSVPs');
    renderAdminDashboard();
  }
}

function exportSubmissionsCSV() {
  const rsvps = JSON.parse(localStorage.getItem('toanCoTra_RSVPs') || '[]');
  if (rsvps.length === 0) {
    alert('Chưa có dữ liệu để xuất file.');
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "Tên Con,Tên Phụ Huynh,Trạng Thái Tham Dự,Thời Gian Gửi\n";

  rsvps.forEach(r => {
    csvContent += `"${r.childName}","${r.parentName}","${r.attendance}","${r.timestamp}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DanhSach_DiemDanh_ToanCoTra_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('pointer-events-none', 'opacity-0');
  overlay.classList.add('opacity-100');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('opacity-100');
  overlay.classList.add('pointer-events-none', 'opacity-0');
}

/**
 * Download PNG Action with Native Web Share API Support
 */
async function downloadExportedImage() {
  if (!appState.exportedImageBase64) {
    alert('Chưa có ảnh thiệp để tải về.');
    return;
  }

  const sanitizedChildName = appState.childName.replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `ThiepMoi_GiaoHuongCuaNhungUocMo_${sanitizedChildName || 'HocSinh'}.png`;

  try {
    const fetchRes = await fetch(appState.exportedImageBase64);
    const blob = await fetchRes.blob();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Thiệp Mời Vinh Danh',
        text: 'Thiệp mời tham dự Giao hưởng của những ước mơ - Hệ Thống Toán Cô Trà'
      });
      return;
    }
  } catch (err) {
    console.log('Chuyển hướng sang phương thức tải file truyền thống:', err);
  }

  const downloadLink = document.createElement('a');
  downloadLink.download = fileName;
  downloadLink.href = appState.exportedImageBase64;
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.removeChild(downloadLink);
}
