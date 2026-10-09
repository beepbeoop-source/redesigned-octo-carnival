import { useState } from 'react'
import { useAttendanceData } from './hooks/useAttendanceData'
import { DesktopSidebar } from './components/layout/DesktopSidebar'
import { MobileHeader } from './components/layout/MobileHeader'
import { FilterBar } from './components/layout/FilterBar'
import { DashboardTab } from './components/dashboard/DashboardTab'
import { AttendanceTab } from './components/attendance/AttendanceTab'
import { OvertimeTab } from './components/overtime/OvertimeTab'
import { DailyWageTab } from './components/dailywage/DailyWageTab'
import { AdvanceTab } from './components/advance/AdvanceTab'
import { StaffTab } from './components/staff/StaffTab'
import { ReportTab } from './components/report/ReportTab'
import { PayslipTab } from './components/payslip/PayslipTab'
import { SettingsTab } from './components/settings/SettingsTab'
import { StaffModal } from './components/modals/StaffModal'
import { AttendanceEditModal } from './components/modals/AttendanceEditModal'
import { StaffActionSheet } from './components/modals/StaffActionSheet'
import { exportPayrollCsv } from './lib/attendanceUtils'
import type { Staff } from './types/attendance'

export function App() {
  const {
    today,
    theme,
    toggleTheme,
    fromDate,
    toDate,
    entryDate,
    payslipMonth,
    activeTab,
    searchQuery,
    departmentFilter,
    outletFilter,
    markFilter,
    staffList,
    filteredStaffList,
    departments,
    outlets,
    storeProfile,
    activeDates,
    isSupabaseConnected,
    supabaseLatency,
    isSyncing,
    setEntryDate,
    setPayslipMonth,
    setActiveTab,
    setSearchQuery,
    setDepartmentFilter,
    setOutletFilter,
    setMarkFilter,
    setStoreProfile,
    renameOutlet,
    handleSetPeriod,
    updateAttendance,
    updateUsualWage,
    updateDailyWage,
    updateOvertime,
    updateAdvance,
    addStaff,
    updateStaff,
    deleteStaff,
    resetFilters,
    pullFromSupabase,
    pushToSupabase
  } = useAttendanceData()

  // Modal & Sheet states
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [isAttendanceEditOpen, setIsAttendanceEditOpen] = useState<boolean>(false)
  const [attendanceEditStaff, setAttendanceEditStaff] = useState<Staff | null>(null)
  const [attendanceEditDate, setAttendanceEditDate] = useState<string>('')

  // Mobile Quick Action Sheet
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(false)
  const [actionSheetStaff, setActionSheetStaff] = useState<Staff | null>(null)
  const [actionSheetDate, setActionSheetDate] = useState<string>(today)

  // Handlers
  const handleOpenAddStaff = () => {
    setEditingStaff(null)
    setIsStaffModalOpen(true)
  }

  const handleOpenEditStaff = (staff: Staff) => {
    setEditingStaff(staff)
    setIsStaffModalOpen(true)
  }

  const handleSaveStaff = (staffData: Omit<Staff, 'attendance' | 'overtime' | 'advances'>) => {
    if (editingStaff) {
      updateStaff({
        ...editingStaff,
        ...staffData
      })
    } else {
      addStaff(staffData)
    }
  }

  const handleOpenAttendanceEdit = (staff: Staff, date: string) => {
    setAttendanceEditStaff(staff)
    setAttendanceEditDate(date)
    setIsAttendanceEditOpen(true)
  }

  const handleOpenActionSheet = (staff: Staff, date?: string) => {
    setActionSheetStaff(staff)
    setActionSheetDate(date || today)
    setIsActionSheetOpen(true)
  }

  const handleExportCsv = () => {
    exportPayrollCsv(staffList, activeDates)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
      {/* Desktop Fixed Left Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        storeProfile={storeProfile}
        fromDate={fromDate}
        toDate={toDate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onManualSync={pushToSupabase}
        isSyncing={isSyncing}
        isSupabaseConnected={isSupabaseConnected}
        supabaseLatency={supabaseLatency}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">
        {/* Mobile Header with Hamburger Menu (Visible on Mobile only) */}
        <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80">
          <MobileHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            storeProfile={storeProfile}
            fromDate={fromDate}
            toDate={toDate}
            theme={theme}
            onToggleTheme={toggleTheme}
            onExportCsv={handleExportCsv}
            onManualSync={pushToSupabase}
            isSyncing={isSyncing}
            isSupabaseConnected={isSupabaseConnected}
            supabaseLatency={supabaseLatency}
          />
        </div>

        <main className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-5 pb-24 md:pb-12 flex-1">

        {/* Global Filter Bar */}
        {activeTab !== 'payslip' && activeTab !== 'settings' && (
          <FilterBar
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            departments={departments}
            outletFilter={outletFilter}
            onOutletChange={setOutletFilter}
            outlets={outlets}
            markFilter={markFilter}
            onMarkFilterChange={setMarkFilter}
            dates={activeDates}
            onReset={resetFilters}
          />
        )}

        {/* Active Tab View */}
        <section className="transition-all duration-150">
          {activeTab === 'dashboard' && (
            <DashboardTab staffList={filteredStaffList} dates={activeDates} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              staffList={filteredStaffList}
              dates={activeDates}
              fromDate={fromDate}
              toDate={toDate}
              today={today}
              onSetPeriod={handleSetPeriod}
              onUpdateAttendance={updateAttendance}
              onUpdateWage={updateUsualWage}
              onOpenAttendanceEdit={handleOpenAttendanceEdit}
              onOpenStaffActionSheet={handleOpenActionSheet}
            />
          )}

          {activeTab === 'overtime' && (
            <OvertimeTab
              staffList={filteredStaffList}
              entryDate={entryDate}
              onEntryDateChange={setEntryDate}
              onUpdateOvertime={updateOvertime}
            />
          )}

          {activeTab === 'dailywage' && (
            <DailyWageTab
              staffList={filteredStaffList}
              entryDate={entryDate}
              onEntryDateChange={setEntryDate}
              onUpdateDailyWage={updateDailyWage}
            />
          )}

          {activeTab === 'advance' && (
            <AdvanceTab
              staffList={filteredStaffList}
              entryDate={entryDate}
              onEntryDateChange={setEntryDate}
              onUpdateAdvance={updateAdvance}
            />
          )}

          {activeTab === 'staff' && (
            <StaffTab
              staffList={filteredStaffList}
              onOpenAddStaff={handleOpenAddStaff}
              onOpenEditStaff={handleOpenEditStaff}
              onDeleteStaff={deleteStaff}
              onOpenStaffActionSheet={handleOpenActionSheet}
            />
          )}

          {activeTab === 'report' && (
            <ReportTab
              staffList={filteredStaffList}
              dates={activeDates}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}

          {activeTab === 'payslip' && (
            <PayslipTab
              staffList={staffList}
              storeProfile={storeProfile}
              payslipMonth={payslipMonth}
              onMonthChange={setPayslipMonth}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              storeProfile={storeProfile}
              staffList={staffList}
              onSaveProfile={setStoreProfile}
              onRenameOutlet={renameOutlet}
              onManualSync={pushToSupabase}
              onPullFromSupabase={pullFromSupabase}
              isSyncing={isSyncing}
              isSupabaseConnected={isSupabaseConnected}
              supabaseLatency={supabaseLatency}
            />
          )}
        </section>
      </main>
    </div>

      {/* Mobile Staff Action Sheet */}
      <StaffActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        staff={actionSheetStaff}
        currentDate={actionSheetDate}
        onUpdateAttendance={updateAttendance}
        onUpdateOvertime={updateOvertime}
        onUpdateAdvance={updateAdvance}
        onUpdateWage={updateUsualWage}
        onOpenEditStaff={handleOpenEditStaff}
        onDeleteStaff={deleteStaff}
      />

      {/* Staff Add / Edit Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={handleSaveStaff}
        editingStaff={editingStaff}
        existingOutlets={storeProfile.outlets}
      />

      {/* Past Attendance Edit Modal */}
      <AttendanceEditModal
        isOpen={isAttendanceEditOpen}
        onClose={() => setIsAttendanceEditOpen(false)}
        staff={attendanceEditStaff}
        date={attendanceEditDate}
        onSave={updateAttendance}
      />
    </div>
  )
}

export default App
