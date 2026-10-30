Module M12: Face Recognition Attendance complete.
Features:
- Models: @vladmandic/face-api deployed in public/models/
- Enrollment: 3 facial angle captures yielding 128-float descriptors, saved in User.faceEnrollment, pending HR approval
- Approval Lifecycle: HR Manager and Super Admin approve, reject with reason, or reset enrollments
- Liveness: Eye Aspect Ratio (EAR) client-side blink tracker preventing static photo spoofing
- Attendance: Euclidean distance matching (< 0.50 threshold) on check-in and check-out punches, records confidenceDistance and snapshotUrl
- Failed Punches: Flagged attendance logged with flagReason: 'face_match_failed' and snapshot photo preview
- Settings: Super Admin can toggle face attendance on/off and configure match threshold
- Manager Scoping: Department Managers view only their department staff's flagged snapshots