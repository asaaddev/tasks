// استبدل هذا الرابط بالـ URL الخاص بـ API الرئيسي لجدول بيانات المهام من SheetDB.io
const SHEETDB_MAIN_API_URL = 'https://sheetdb.io/api/v1/gv7yywbjg53qh';
// استبدل هذا الرابط بالـ URL الخاص بـ API لورقة المستخدمين (المدراء والموظفين) من SheetDB.io
const USERS_API_URL = 'https://sheetdb.io/api/v1/c15b3ne610k8c';

// الحصول على عناصر DOM
const messageDiv = document.getElementById('message');
const tasksTableBody = document.getElementById('tasksTableBody');
const logoutBtn = document.getElementById('logoutBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const openAddTaskModalBtn = document.getElementById('openAddTaskModalBtn');
const addTaskModal = document.getElementById('addTaskModal');
const closeAddTaskModalBtn = document.getElementById('closeAddTaskModalBtn');
const addTaskForm = document.getElementById('addTaskForm');
const taskEmployeeSelect = document.getElementById('taskEmployee');
const taskDateInput = document.getElementById('taskDate');
const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const closeEditTaskModalBtn = document.getElementById('closeEditTaskModalBtn');
const pendingCount = document.getElementById('pendingCount');
const reviewCount = document.getElementById('reviewCount');
const completedCount = document.getElementById('completedCount');
const monthFilterSelect = document.getElementById('monthFilter');
const weekFilterSelect = document.getElementById('weekFilter');
const employeeFilterSelect = document.getElementById('employeeFilter'); // عنصر جديد للفلترة بالموظف

let allTasksData = [];
let loggedInUserName = '';
let dataLoaded = false;

// دالة للتحقق من تسجيل دخول المدير
function checkAdminLogin() {
    const userType = localStorage.getItem('loggedInUserType');
    loggedInUserName = localStorage.getItem('loggedInUserName');

    if (!userType || userType !== 'admin' || !loggedInUserName) {
        alert('يجب تسجيل الدخول كمدير للوصول إلى هذه الصفحة.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// دالة لجلب جميع المهام من API
async function fetchAllTasks() {
    messageDiv.textContent = 'جاري تحميل البيانات...';
    messageDiv.className = 'loading-message';
    try {
        const response = await fetch(SHEETDB_MAIN_API_URL);
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة أو الخادم: ${response.status} ${response.statusText}`);
        }
        let data = await response.json();
        if (!Array.isArray(data)) {
            data = [];
        }
        allTasksData = data.map((task, index) => ({
            ...task,
            ID: task.ID || `row-id-${index + 1}`
        }));
        messageDiv.textContent = '';
        messageDiv.className = 'hidden';
        return allTasksData;
    } catch (error) {
        console.error('حدث خطأ أثناء جلب المهام:', error);
        messageDiv.textContent = `حدث خطأ في تحميل المهام: ${error.message}`;
        messageDiv.className = 'error-message';
        return null;
    }
}

// دالة لجلب الموظفين لملء قائمة الاختيار (لإضافة مهمة)
async function populateEmployeeSelect() {
    try {
        const response = await fetch(`${USERS_API_URL}/search?Role=employee`);
        if (!response.ok) {
            throw new Error(`خطأ في جلب الموظفين: ${response.status} ${response.statusText}`);
        }
        const employees = await response.json();
        
        // لملء قائمة اختيار إضافة مهمة
        taskEmployeeSelect.innerHTML = '<option value="">اختر موظفًا</option>';
        // لملء قائمة اختيار الفلترة
        employeeFilterSelect.innerHTML = '<option value="all">كل الموظفين</option>';

        if (Array.isArray(employees)) {
             employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.Name;
                option.textContent = employee.Name;
                taskEmployeeSelect.appendChild(option.cloneNode(true)); // لإضافة مهمة
                employeeFilterSelect.appendChild(option); // للفلترة
            });
        }
    } catch (error) {
        console.error('فشل في جلب قائمة الموظفين:', error);
        taskEmployeeSelect.innerHTML = '<option value="">فشل التحميل</option>';
        employeeFilterSelect.innerHTML = '<option value="all">فشل التحميل</option>';
    }
}

// دالة لعرض المهام في الجدول بناءً على الفلتر والحالة
function displayTasks(statusFilter = 'all', monthFilter = 'all', weekFilter = 'all', employeeFilter = 'all') {
    // تحديث العدادات فقط إذا كانت البيانات محملة
    if(dataLoaded){
        pendingCount.textContent = allTasksData.filter(t => t.الحالة === 'قيد التنفيذ').length;
        reviewCount.textContent = allTasksData.filter(t => t.الحالة === 'قيد المراجعة').length;
        completedCount.textContent = allTasksData.filter(t => t.الحالة === 'مكتملة').length;
    }

    let filteredTasks = allTasksData;

    // تطبيق فلتر الحالة
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.الحالة === statusFilter);
    }

    // تطبيق فلتر الموظف
    if (employeeFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.الموظف === employeeFilter);
    }

    // تطبيق فلتر الشهر
    if (monthFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => {
            const taskDate = new Date(task.التاريخ);
            return (taskDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;
        });
    }

    // تطبيق فلتر الأسبوع
    if (weekFilter !== 'all' && monthFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => {
            const taskDate = new Date(task.التاريخ);
            const day = taskDate.getDate();
            const week = Math.ceil(day / 7);
            return week.toString() === weekFilter;
        });
    }

    tasksTableBody.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">لا توجد مهام حاليًا.</td></tr>`;
        return;
    }
    
    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        let actionButtons = `
            <i class="fas fa-edit action-icon edit-icon" title="تعديل" onclick="openEditTaskModal('${task.ID}')"></i>
            <i class="fas fa-trash-alt action-icon delete-icon" title="حذف" onclick="deleteTask('${task.ID}')"></i>
        `;

        if (task.الحالة !== 'مكتملة') {
            actionButtons = `
                <i class="fas fa-check-circle action-icon approve-icon" title="تحويل إلى مكتملة" onclick="updateTaskStatus('${task.ID}', 'مكتملة')"></i>
                ${actionButtons}
            `;
        }

        row.innerHTML = `
            <td>${task.التاريخ || ''}</td>
            <td>${task.الموظف || ''}</td>
            <td>${task.المهمة || ''}</td>
            <td>${task.الحالة || ''}</td>
            <td>${task.ملاحظات || ''}</td>
            <td>${actionButtons}</td>
        `;
        tasksTableBody.appendChild(row);
    });
}

// دالة لإضافة مهمة جديدة
async function addNewTask(event) {
    event.preventDefault();

    const taskData = {
        'التاريخ': taskDateInput.value,
        'الموظف': taskEmployeeSelect.value,
        'المهمة': document.getElementById('taskName').value,
        'الحالة': 'قيد التنفيذ',
        'ملاحظات': document.getElementById('taskNotes').value,
        'أضيف بواسطة': loggedInUserName
    };

    try {
        const response = await fetch(SHEETDB_MAIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: taskData })
        });

        if (!response.ok) {
            throw new Error(`خطأ في إضافة المهمة: ${response.status} ${response.statusText}`);
        }
        
        alert('تمت إضافة المهمة بنجاح.');
        addTaskForm.reset();
        addTaskModal.style.display = 'none';
        await fetchAndDisplayTasks(true); 
    } catch (error) {
        console.error('فشل في إضافة المهمة:', error);
        alert(`فشل في إضافة المهمة: ${error.message}`);
    }
}

// دالة لفتح نافذة تعديل المهمة
function openEditTaskModal(taskId) {
    const taskToEdit = allTasksData.find(task => task.ID == taskId);
    if (!taskToEdit) {
        alert('المهمة غير موجودة!');
        return;
    }
    document.getElementById('editTaskId').value = taskToEdit.ID;
    document.getElementById('editTaskDate').value = taskToEdit.التاريخ || '';
    document.getElementById('editTaskEmployee').value = taskToEdit.الموظف || '';
    document.getElementById('editTaskName').value = taskToEdit.المهمة || '';
    document.getElementById('editTaskStatus').value = taskToEdit.الحالة || '';
    document.getElementById('editTaskNotes').value = taskToEdit.ملاحظات || '';
    editTaskModal.style.display = 'block';
}

// دالة لحفظ التغييرات في المهمة
async function saveEditedTask(event) {
    event.preventDefault();
    const taskId = document.getElementById('editTaskId').value;
    const taskData = {
        'التاريخ': document.getElementById('editTaskDate').value,
        'الموظف': document.getElementById('editTaskEmployee').value,
        'المهمة': document.getElementById('editTaskName').value,
        'الحالة': document.getElementById('editTaskStatus').value,
        'ملاحظات': document.getElementById('editTaskNotes').value
    };
    try {
        const response = await fetch(`${SHEETDB_MAIN_API_URL}/ID/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: taskData })
        });
        if (!response.ok) {
            throw new Error(`خطأ في حفظ التغييرات: ${response.status} ${response.statusText}`);
        }
        alert('تم حفظ التغييرات بنجاح.');
        editTaskModal.style.display = 'none';
        await fetchAndDisplayTasks(true);
    } catch (error) {
        console.error('فشل في حفظ التغييرات:', error);
        alert(`فشل في حفظ التغييرات: ${error.message}`);
    }
}

// دالة لحذف مهمة
async function deleteTask(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        try {
            const response = await fetch(`${SHEETDB_MAIN_API_URL}/ID/${taskId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`خطأ في حذف المهمة: ${response.status} ${response.statusText}`);
            }
            alert('تم حذف المهمة بنجاح.');
            await fetchAndDisplayTasks(true);
        } catch (error) {
            console.error('فشل في حذف المهمة:', error);
            alert(`فشل في حذف المهمة: ${error.message}`);
        }
    }
}

// دالة لتحديث حالة المهمة (موافقة/رفض)
async function updateTaskStatus(taskId, newStatus) {
    if (!confirm(`هل أنت متأكد من تغيير حالة المهمة إلى "${newStatus}"؟`)) {
        return;
    }
    try {
        const response = await fetch(`${SHEETDB_MAIN_API_URL}/ID/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { 'الحالة': newStatus } })
        });
        if (!response.ok) {
            throw new Error(`خطأ في تحديث الحالة: ${response.status} ${response.statusText}`);
        }
        alert(`تم تحديث حالة المهمة بنجاح إلى "${newStatus}".`);
        await fetchAndDisplayTasks(true);
    } catch (error) {
        console.error('فشل في تحديث حالة المهمة:', error);
        alert(`فشل في تحديث حالة المهمة: ${error.message}`);
    }
}

// دالة رئيسية لجلب وعرض المهام
async function fetchAndDisplayTasks(shouldFetchData = false) {
    if (shouldFetchData) {
        const fetchedTasks = await fetchAllTasks();
        if (!fetchedTasks) {
            return;
        }
    }
    
    const activeStatusFilter = document.querySelector('.filter-buttons .active')?.dataset.filter || 'all';
    const activeMonthFilter = monthFilterSelect.value;
    const activeWeekFilter = weekFilterSelect.value;
    const activeEmployeeFilter = employeeFilterSelect.value;
    
    displayTasks(activeStatusFilter, activeMonthFilter, activeWeekFilter, activeEmployeeFilter);
}

// Event Listeners
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelector('.filter-buttons .active')?.classList.remove('active');
        e.target.classList.add('active');
        
        if (!dataLoaded) {
            dataLoaded = true;
            fetchAndDisplayTasks(true);
        } else {
            const activeStatusFilter = e.target.dataset.filter;
            const activeMonthFilter = monthFilterSelect.value;
            const activeWeekFilter = weekFilterSelect.value;
            const activeEmployeeFilter = employeeFilterSelect.value;
            displayTasks(activeStatusFilter, activeMonthFilter, activeWeekFilter, activeEmployeeFilter);
        }
    });
});

monthFilterSelect.addEventListener('change', () => {
    if (!dataLoaded) {
        dataLoaded = true;
        fetchAndDisplayTasks(true);
    } else {
        const activeStatusFilter = document.querySelector('.filter-buttons .active')?.dataset.filter || 'all';
        const activeMonthFilter = monthFilterSelect.value;
        const activeWeekFilter = weekFilterSelect.value;
        const activeEmployeeFilter = employeeFilterSelect.value;
        displayTasks(activeStatusFilter, activeMonthFilter, activeWeekFilter, activeEmployeeFilter);
    }
});

weekFilterSelect.addEventListener('change', () => {
    if (!dataLoaded) {
        dataLoaded = true;
        fetchAndDisplayTasks(true);
    } else {
        const activeStatusFilter = document.querySelector('.filter-buttons .active')?.dataset.filter || 'all';
        const activeMonthFilter = monthFilterSelect.value;
        const activeWeekFilter = weekFilterSelect.value;
        const activeEmployeeFilter = employeeFilterSelect.value;
        displayTasks(activeStatusFilter, activeMonthFilter, activeWeekFilter, activeEmployeeFilter);
    }
});

employeeFilterSelect.addEventListener('change', () => {
    if (!dataLoaded) {
        dataLoaded = true;
        fetchAndDisplayTasks(true);
    } else {
        const activeStatusFilter = document.querySelector('.filter-buttons .active')?.dataset.filter || 'all';
        const activeMonthFilter = monthFilterSelect.value;
        const activeWeekFilter = weekFilterSelect.value;
        const activeEmployeeFilter = employeeFilterSelect.value;
        displayTasks(activeStatusFilter, activeMonthFilter, activeWeekFilter, activeEmployeeFilter);
    }
});

logoutBtn.addEventListener('click', () => { 
    localStorage.removeItem('loggedInUserType'); 
    localStorage.removeItem('loggedInUserName'); 
    window.location.href = 'login.html'; 
});

openAddTaskModalBtn.addEventListener('click', () => { 
    addTaskModal.style.display = 'block'; 
});

closeAddTaskModalBtn.addEventListener('click', () => { 
    addTaskModal.style.display = 'none'; 
});

window.addEventListener('click', (event) => { 
    if (event.target === addTaskModal) { 
        addTaskModal.style.display = 'none'; 
    } 
});

closeEditTaskModalBtn.addEventListener('click', () => { 
    editTaskModal.style.display = 'none'; 
});

window.addEventListener('click', (event) => { 
    if (event.target === editTaskModal) { 
        editTaskModal.style.display = 'none'; 
    } 
});

addTaskForm.addEventListener('submit', addNewTask);
editTaskForm.addEventListener('submit', saveEditedTask);

// بدء تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    if (checkAdminLogin()) {
        const today = new Date().toISOString().slice(0, 10);
        taskDateInput.value = today;
        await populateEmployeeSelect();
        
        tasksTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">الرجاء اختيار فلتر لعرض المهام.</td></tr>`;
        pendingCount.textContent = '0';
        reviewCount.textContent = '0';
        completedCount.textContent = '0';
    }
});