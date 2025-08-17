// FIXED ATTENDANCE FUNCTION - Replace the markQuickAttendance function with this

const markQuickAttendance = async (patientId: string, status: 'Present' | 'Absent' | 'Late') => {
  try {
    console.log('🚀 markQuickAttendance called with:', { patientId, status });
    
    // STEP 1: Find the patient and convert ID to correct format
    const selectedPatient = patients.find(p => 
      p.patient_id === patientId || p.id.toString() === patientId
    );
    console.log('🔍 Found patient:', selectedPatient);
    
    if (!selectedPatient) {
      console.error('❌ Patient not found with ID:', patientId);
      return;
    }

    // Convert to P format if numeric (1 -> P0001, 100 -> P0100)
    const formattedPatientId = selectedPatient.patient_id?.startsWith('P') 
      ? selectedPatient.patient_id 
      : `P${selectedPatient.id.toString().padStart(4, '0')}`;
    
    console.log('🔧 Formatted patient ID:', formattedPatientId);

    // STEP 2: Check for existing attendance
    const targetDate = dateFilter || format(new Date(), 'yyyy-MM-dd');
    
    const existingAttendance = attendanceRecords.find(record => 
      record && 
      record.patient_id === formattedPatientId && 
      (() => {
        const recordDate = record.date || record.attendance_date;
        if (!recordDate) return false;
        
        let formattedRecordDate;
        if (typeof recordDate === 'string' && recordDate.includes('T')) {
          formattedRecordDate = recordDate.split('T')[0];
        } else {
          formattedRecordDate = format(new Date(recordDate), 'yyyy-MM-dd');
        }
        
        return formattedRecordDate === targetDate;
      })()
    );
    
    console.log('🔍 Found existing attendance:', existingAttendance);

    // STEP 3: Update or Create
    if (existingAttendance && existingAttendance.id) {
      console.log('🔄 UPDATING existing record with ID:', existingAttendance.id);
      
      const updateData = {
        status,
        notes: `Updated to ${status} mark`
      };
      
      try {
        // Use PUT request to update existing record
        const response = await fetch(`http://localhost:4000/api/patient-attendance/${existingAttendance.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ UPDATE SUCCESSFUL:', result);
          
          // Immediately update the local state
          const updatedRecords = attendanceRecords.map(record => {
            if (record.id === existingAttendance.id) {
              return {
                ...record,
                status: status,
                check_in_time: result.checkInTime || format(new Date(), 'HH:mm'),
                notes: updateData.notes,
                updated_at: new Date().toISOString()
              };
            }
            return record;
          });
          setAttendanceRecords(updatedRecords);
        } else {
          console.error('❌ UPDATE FAILED:', await response.text());
        }
      } catch (updateError) {
        console.error('❌ UPDATE ERROR:', updateError);
      }
      
    } else {
      console.log('➕ CREATING new record');
      
      const attendanceData = {
        patientId: formattedPatientId, // Use correct P format
        patientName: selectedPatient.name,
        date: targetDate,
        checkInTime: format(new Date(), 'HH:mm'),
        status,
        notes: `Quick ${status} mark`
      };
      
      try {
        // Use POST request to create new record
        const response = await fetch('http://localhost:4000/api/patient-attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attendanceData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ CREATE SUCCESSFUL:', result);
          
          // Add to local state
          const newRecord: AttendanceRecord = {
            id: result.id?.toString() || Date.now().toString(),
            patient_id: formattedPatientId,
            patient_name: selectedPatient.name,
            patient_phone: selectedPatient.phone || '',
            patient_image: selectedPatient.image || '',
            attendance_date: targetDate,
            date: targetDate,
            status: status,
            check_in_time: attendanceData.checkInTime,
            check_out_time: '',
            notes: attendanceData.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setAttendanceRecords([...attendanceRecords, newRecord]);
        } else {
          console.error('❌ CREATE FAILED:', await response.text());
        }
      } catch (createError) {
        console.error('❌ CREATE ERROR:', createError);
      }
    }

    // Reload data to confirm changes
    setTimeout(() => loadData(), 500);
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
  }
};
