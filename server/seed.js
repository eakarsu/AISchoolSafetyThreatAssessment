const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS community_risks CASCADE;
      DROP TABLE IF EXISTS weapon_detections CASCADE;
      DROP TABLE IF EXISTS communication_alerts CASCADE;
      DROP TABLE IF EXISTS access_control_logs CASCADE;
      DROP TABLE IF EXISTS drill_records CASCADE;
      DROP TABLE IF EXISTS anonymous_tips CASCADE;
      DROP TABLE IF EXISTS mental_health_screenings CASCADE;
      DROP TABLE IF EXISTS bullying_reports CASCADE;
      DROP TABLE IF EXISTS training_programs CASCADE;
      DROP TABLE IF EXISTS safety_audits CASCADE;
      DROP TABLE IF EXISTS visitor_logs CASCADE;
      DROP TABLE IF EXISTS emergency_plans CASCADE;
      DROP TABLE IF EXISTS behavioral_analyses CASCADE;
      DROP TABLE IF EXISTS incident_reports CASCADE;
      DROP TABLE IF EXISTS threat_assessments CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE threat_assessments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) CHECK (status IN ('open', 'investigating', 'resolved')) DEFAULT 'open',
        reported_by VARCHAR(255),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE incident_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        incident_type VARCHAR(100),
        location VARCHAR(255),
        date DATE,
        severity VARCHAR(20),
        status VARCHAR(20) CHECK (status IN ('reported', 'investigating', 'resolved')) DEFAULT 'reported',
        reported_by VARCHAR(255),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE behavioral_analyses (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        grade VARCHAR(20),
        behavior_type VARCHAR(100),
        description TEXT,
        frequency VARCHAR(50),
        risk_level VARCHAR(20),
        counselor_notes TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency_plans (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        emergency_type VARCHAR(100),
        description TEXT,
        procedures TEXT,
        responsible_staff VARCHAR(255),
        last_updated DATE,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE visitor_logs (
        id SERIAL PRIMARY KEY,
        visitor_name VARCHAR(255) NOT NULL,
        purpose VARCHAR(255),
        host_staff VARCHAR(255),
        check_in TIME,
        check_out TIME,
        id_verified BOOLEAN DEFAULT false,
        risk_score INTEGER DEFAULT 0,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE safety_audits (
        id SERIAL PRIMARY KEY,
        area VARCHAR(255),
        audit_type VARCHAR(100),
        findings TEXT,
        risk_rating VARCHAR(20),
        recommendations TEXT,
        auditor VARCHAR(255),
        audit_date DATE,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE training_programs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        target_audience VARCHAR(255),
        duration VARCHAR(50),
        completion_rate INTEGER DEFAULT 0,
        next_session DATE,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE bullying_reports (
        id SERIAL PRIMARY KEY,
        reporter_type VARCHAR(50),
        victim_grade VARCHAR(20),
        bully_grade VARCHAR(20),
        incident_type VARCHAR(100),
        description TEXT,
        location VARCHAR(255),
        action_taken TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE mental_health_screenings (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        grade VARCHAR(20),
        screening_type VARCHAR(100),
        risk_indicators TEXT,
        recommendations TEXT,
        follow_up_date DATE,
        counselor VARCHAR(255),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE anonymous_tips (
        id SERIAL PRIMARY KEY,
        tip_category VARCHAR(100),
        message TEXT,
        priority VARCHAR(20),
        status VARCHAR(20) CHECK (status IN ('new', 'reviewing', 'actionable', 'resolved')) DEFAULT 'new',
        location_hint VARCHAR(255),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE drill_records (
        id SERIAL PRIMARY KEY,
        drill_type VARCHAR(100),
        date DATE,
        duration_minutes INTEGER,
        participants INTEGER,
        issues_found TEXT,
        rating VARCHAR(20),
        next_drill DATE,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE access_control_logs (
        id SERIAL PRIMARY KEY,
        entry_point VARCHAR(255),
        person_type VARCHAR(100),
        access_method VARCHAR(100),
        timestamp TIMESTAMP,
        authorized BOOLEAN DEFAULT true,
        flagged BOOLEAN DEFAULT false,
        notes TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE communication_alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(100),
        title VARCHAR(255),
        message TEXT,
        priority VARCHAR(20),
        target_audience VARCHAR(255),
        sent_at TIMESTAMP,
        status VARCHAR(50),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE weapon_detections (
        id SERIAL PRIMARY KEY,
        detection_type VARCHAR(100),
        location VARCHAR(255),
        description TEXT,
        threat_level VARCHAR(20),
        response_action TEXT,
        detected_by VARCHAR(255),
        status VARCHAR(50),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE community_risks (
        id SERIAL PRIMARY KEY,
        risk_type VARCHAR(100),
        area VARCHAR(255),
        description TEXT,
        risk_level VARCHAR(20),
        mitigation TEXT,
        reported_by VARCHAR(255),
        last_assessed DATE,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully.');

    // Seed admin user
    const passwordHash = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ['admin@school.edu', passwordHash, 'Admin User', 'admin']
    );
    console.log('Admin user created.');

    // Seed threat_assessments
    const threats = [
      ['Suspicious Individual Near Playground', 'An unidentified adult was observed lingering near the elementary playground during recess for three consecutive days. Individual appeared to be photographing children.', 'Elementary Playground - Building A', 'high', 'investigating', 'Officer Martinez'],
      ['Online Threat Posted on Social Media', 'A threatening post was discovered on a student social media account referencing violence toward specific classmates. Screenshot has been preserved.', 'Online / Social Media', 'critical', 'investigating', 'Counselor Johnson'],
      ['Vandalism with Threatening Graffiti', 'Threatening graffiti found in the boys restroom on the second floor. Messages contain specific threats against a teacher by name.', 'Building B - 2nd Floor Restroom', 'medium', 'open', 'Janitor Williams'],
      ['Unattended Backpack in Cafeteria', 'An unattended backpack was found under a table in the cafeteria 30 minutes after lunch period ended. Contents unknown.', 'Main Cafeteria', 'medium', 'resolved', 'Lunch Monitor Davis'],
      ['Verbal Threat During Class', 'Student made verbal threats toward another student during history class, stating intent to cause physical harm after school.', 'Room 204 - History Class', 'high', 'investigating', 'Teacher Thompson'],
      ['Broken Perimeter Fence Section', 'A 10-foot section of the perimeter fence along the south boundary has been cut and bent, allowing unrestricted access to school grounds.', 'South Perimeter Fence', 'medium', 'open', 'Groundskeeper Adams'],
      ['Threatening Note Found in Locker', 'A handwritten note containing violent threats was discovered in a student locker during a routine inspection. Note references a specific date.', 'Locker Bay C - Building A', 'critical', 'investigating', 'VP Richardson'],
      ['Suspicious Vehicle in Parking Lot', 'An unfamiliar vehicle with tinted windows has been parked in the visitor lot for 4 hours without anyone entering the building. License plate recorded.', 'Visitor Parking Lot', 'low', 'resolved', 'Security Guard Chen'],
      ['Anonymous Bomb Threat Via Phone', 'The main office received an anonymous phone call at 10:23 AM claiming an explosive device was placed somewhere in the school. Call has been traced.', 'Main Office / School-wide', 'critical', 'resolved', 'Secretary Miller'],
      ['Student Brought Prohibited Item', 'A student was found in possession of a large hunting knife during a bag check at the metal detector station near the main entrance.', 'Main Entrance Security', 'high', 'resolved', 'SRO Officer Brooks'],
      ['Cyberbullying Escalation to Physical Threats', 'An ongoing cyberbullying situation has escalated with the aggressor making explicit physical threats via text messages. Parents have been notified.', 'Online / Multiple Locations', 'medium', 'investigating', 'Counselor Patel'],
      ['Unauthorized Person in Building', 'An individual without a visitor badge was found wandering the hallways near the kindergarten wing. Person claimed to be a parent but could not be verified.', 'Building C - Kindergarten Wing', 'high', 'resolved', 'Teacher Morrison'],
      ['Threatening Behavior at Bus Stop', 'Reports of an older student intimidating and threatening younger students at the Pine Street bus stop. Multiple parents have called to report.', 'Pine Street Bus Stop', 'medium', 'open', 'Transportation Dir. Lewis'],
      ['Chemical Spill in Science Lab', 'A significant chemical spill occurred in the chemistry lab involving hydrochloric acid. Area has been evacuated and contained.', 'Building B - Chemistry Lab 301', 'high', 'resolved', 'Teacher Dr. Nguyen'],
      ['Stalking Behavior Reported', 'A staff member reported being followed to and from school by an unknown individual in a dark sedan for the past week. Police report filed.', 'School Vicinity / Parking Area', 'high', 'investigating', 'Teacher Rodriguez'],
    ];
    for (const t of threats) {
      await client.query(
        `INSERT INTO threat_assessments (title, description, location, threat_level, status, reported_by) VALUES ($1,$2,$3,$4,$5,$6)`,
        t
      );
    }

    // Seed incident_reports
    const incidents = [
      ['Slip and Fall in Gymnasium', 'A 7th grade student slipped on a wet spot near the gymnasium entrance during PE class, resulting in a sprained ankle. Paramedics were called.', 'Slip and Fall', 'Gymnasium - Building D', '2026-03-15', 'moderate', 'reported', 'Coach Harper'],
      ['Physical Altercation in Hallway', 'Two 10th grade students engaged in a physical fight in the main hallway between 2nd and 3rd period. Both students sustained minor injuries.', 'Physical Altercation', 'Main Hallway - Building A', '2026-03-18', 'high', 'investigating', 'Hall Monitor Jenkins'],
      ['Fire Alarm Malfunction', 'The fire alarm in Building C activated without cause during 4th period, causing an unplanned evacuation. System diagnosed with faulty sensor.', 'Equipment Malfunction', 'Building C - 1st Floor', '2026-03-20', 'low', 'resolved', 'Facilities Manager Ross'],
      ['Allergic Reaction in Cafeteria', 'A 5th grade student experienced a severe allergic reaction to tree nuts during lunch. EpiPen was administered by school nurse.', 'Medical Emergency', 'Main Cafeteria', '2026-03-22', 'high', 'resolved', 'Nurse Campbell'],
      ['Theft of School Equipment', 'Three laptop computers were reported stolen from the computer lab over the weekend. Security camera footage is being reviewed.', 'Theft', 'Computer Lab - Room 112', '2026-03-25', 'moderate', 'investigating', 'IT Director Walsh'],
      ['Bus Accident - Minor Collision', 'School bus #14 was involved in a minor rear-end collision at the intersection of Oak and Main. No student injuries reported.', 'Vehicle Accident', 'Oak St. & Main St. Intersection', '2026-03-27', 'moderate', 'resolved', 'Bus Driver Patterson'],
      ['Playground Equipment Injury', 'A 3rd grade student fell from the monkey bars during recess and fractured their wrist. Equipment was inspected and found to be within safety standards.', 'Playground Injury', 'Elementary Playground', '2026-03-29', 'moderate', 'resolved', 'Recess Monitor Garcia'],
      ['Unauthorized Photography', 'An unknown individual was observed photographing students through the fence during outdoor PE class. Police were contacted immediately.', 'Suspicious Activity', 'Athletic Field - South Side', '2026-04-01', 'high', 'investigating', 'Coach Simmons'],
      ['Water Main Break', 'A water main break flooded the basement of Building B, affecting the HVAC system and storage areas. School remained open with modified operations.', 'Facility Damage', 'Building B - Basement', '2026-04-02', 'moderate', 'resolved', 'Maintenance Lead Turner'],
      ['Student Medical Episode - Seizure', 'A 9th grade student experienced a seizure during mathematics class. Emergency protocols were followed and student was transported to hospital.', 'Medical Emergency', 'Room 305 - Math Class', '2026-04-03', 'high', 'resolved', 'Teacher Franklin'],
      ['Harassment Report Filed', 'A staff member filed a formal harassment complaint against a parent who made threatening statements during a parent-teacher conference.', 'Harassment', 'Conference Room B', '2026-04-04', 'moderate', 'investigating', 'Teacher Coleman'],
      ['Roof Leak Causes Ceiling Tile Collapse', 'Heavy rain caused a ceiling tile to collapse in a 6th grade classroom. Room was evacuated immediately. No injuries reported.', 'Structural Issue', 'Room 208 - Building A', '2026-04-05', 'moderate', 'resolved', 'Teacher Phillips'],
      ['Student Panic Attack During Lockdown Drill', 'During a scheduled lockdown drill, a student with PTSD experienced a severe panic attack requiring medical attention.', 'Mental Health Incident', 'Room 104 - Building C', '2026-04-06', 'moderate', 'resolved', 'Counselor Anderson'],
      ['Graffiti with Gang Symbols', 'Gang-related graffiti was discovered on the exterior wall of the athletic building. Photos documented and local police gang unit notified.', 'Vandalism', 'Athletic Building - East Wall', '2026-04-07', 'high', 'investigating', 'SRO Officer Brooks'],
      ['Power Outage During Testing', 'A power outage lasting 2 hours affected the entire campus during standardized testing. Backup generators failed in Building A.', 'Infrastructure Failure', 'Campus-wide', '2026-04-08', 'moderate', 'resolved', 'Principal Martinez'],
    ];
    for (const i of incidents) {
      await client.query(
        `INSERT INTO incident_reports (title, description, incident_type, location, date, severity, status, reported_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        i
      );
    }

    // Seed behavioral_analyses
    const behaviors = [
      ['Marcus Johnson', '9th', 'Aggression', 'Student has displayed escalating aggressive behavior toward peers, including shoving in hallways and verbal intimidation during class transitions.', 'Daily', 'high', 'Student has history of domestic instability. Father recently incarcerated. Recommend immediate intervention and anger management counseling.'],
      ['Emily Chen', '7th', 'Social Withdrawal', 'Previously outgoing student has become increasingly isolated over the past month. Refusing to participate in group activities and eating lunch alone.', 'Daily', 'medium', 'Possible bullying situation. Will schedule meeting with parents and monitor peer interactions closely.'],
      ['Tyler Washington', '11th', 'Substance Abuse Indicators', 'Student has been arriving to morning classes appearing disoriented. Grades have dropped from B average to failing. Bloodshot eyes observed multiple times.', 'Weekly', 'high', 'Contacted parents. Will refer to school substance abuse counselor. Monitor attendance patterns.'],
      ['Sophia Rodriguez', '5th', 'Anxiety', 'Student exhibits severe test anxiety manifesting as stomach aches, crying, and refusal to enter classroom on test days. Parents report similar behavior at home.', 'Weekly', 'medium', 'Implementing test anxiety reduction strategies. Working with parents on coping mechanisms. Consider 504 plan accommodations.'],
      ['Jamal Williams', '10th', 'Defiance', 'Increasing pattern of defiant behavior toward authority figures. Refuses to follow classroom rules, walks out of class without permission.', 'Daily', 'medium', 'Student recently moved from another district. May be adjusting. Schedule conference with guardian. Implement behavior contract.'],
      ['Olivia Martinez', '8th', 'Self-Harm Indicators', 'Teacher noticed marks on student arms consistent with self-harm. Student became evasive when asked about them.', 'Unknown', 'critical', 'IMMEDIATE: Contacted parents and scheduled emergency session. Referred to outside therapist. Safety plan in place.'],
      ['Ethan Cooper', '6th', 'Bullying Behavior', 'Student has been identified as the primary aggressor in multiple bullying incidents targeting younger students on the bus and in hallways.', 'Daily', 'high', 'Implemented behavioral intervention plan. Parents aware but minimally cooperative. Considering bus suspension.'],
      ['Ava Thompson', '12th', 'Academic Decline', 'Senior student with previously excellent academic record showing rapid decline. Missing assignments, sleeping in class, disengaged from college prep activities.', 'Daily', 'medium', 'May be experiencing senioritis or external stressors. Schedule meeting to discuss. Check in with college counselor.'],
      ['Liam Foster', '3rd', 'Emotional Dysregulation', 'Student has frequent emotional outbursts including screaming and throwing objects. Episodes last 15-20 minutes and disrupt entire class.', 'Multiple times weekly', 'high', 'Working with special education team on FBA. Consider evaluation for emotional disturbance classification.'],
      ['Isabella Kim', '9th', 'Truancy', 'Student has been absent 22 days this semester with patterns suggesting school avoidance rather than illness. Parents contacted but unresponsive.', 'Weekly', 'medium', 'Filed truancy report with district. Attempting home visit. May need CPS referral if parents remain unresponsive.'],
      ['Noah Brown', '4th', 'Physical Aggression', 'Student has bitten two classmates and a teacher this month. Behavior appears triggered by unexpected changes in routine.', 'Weekly', 'high', 'Recommend ASD evaluation. Implement visual schedule and transition warnings. Assign dedicated aide during transitions.'],
      ['Mia Davis', '11th', 'Eating Disorder Signs', 'Teacher reports student frequently skipping lunch, dramatic weight loss, and excessive exercise during free periods. Peers have expressed concern.', 'Daily', 'high', 'Confidential meeting with student scheduled. Will refer to school nurse for weight tracking. Parent notification pending.'],
      ['Aiden Wilson', '7th', 'Violent Ideation', 'Student submitted a creative writing assignment containing graphic violent themes targeting school setting. Content raised concern among multiple staff.', 'Isolated', 'critical', 'PRIORITY: Threat assessment team convened. Student removed from class pending evaluation. Parents meeting tomorrow.'],
      ['Charlotte Moore', '2nd', 'Separation Anxiety', 'Student becomes hysterical when parent leaves during morning drop-off. Clings to teacher and cries for extended periods disrupting class.', 'Daily', 'medium', 'Gradual separation protocol implemented. Working with parent on consistent drop-off routine. Consider play therapy referral.'],
      ['Jackson Taylor', '10th', 'Peer Conflict', 'Student involved in escalating verbal conflicts with a specific peer group. Tensions appear related to social media disputes that are carrying into school.', 'Weekly', 'medium', 'Mediation session planned with both parties. Social media guidelines reviewed. Monitoring hallway interactions.'],
    ];
    for (const b of behaviors) {
      await client.query(
        `INSERT INTO behavioral_analyses (student_name, grade, behavior_type, description, frequency, risk_level, counselor_notes) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        b
      );
    }

    // Seed emergency_plans
    const emergencyPlans = [
      ['Active Shooter Response Protocol', 'Active Shooter', 'Comprehensive response plan for active shooter scenarios including lockdown procedures, communication protocols, and coordination with law enforcement.', '1. Activate Code Red lockdown via PA system\n2. Lock all classroom doors and barricade\n3. Move students away from doors and windows\n4. Silence all phones and devices\n5. Contact 911 immediately\n6. Notify district emergency coordinator\n7. Do not open doors until all-clear from law enforcement\n8. Account for all students using roster\n9. Provide first aid as needed\n10. Evacuate only when directed by law enforcement', 'Principal Martinez, SRO Officer Brooks', '2026-02-15'],
      ['Fire Evacuation Plan', 'Fire', 'Structured evacuation procedures for fire emergencies including primary and secondary routes, assembly points, and accountability.', '1. Activate fire alarm if not already sounding\n2. Call 911\n3. Teachers lead students via primary evacuation route\n4. If primary blocked, use secondary route\n5. Close doors behind you\n6. Proceed to designated assembly area\n7. Take attendance and report to grade-level coordinator\n8. Do not re-enter building\n9. Notify parents via mass communication system\n10. Follow reunification procedures if needed', 'Fire Marshal Davis, Facilities Manager Ross', '2026-01-20'],
      ['Severe Weather Shelter Plan', 'Tornado/Severe Weather', 'Procedures for tornado warnings and severe weather events including shelter locations and student accountability.', '1. Monitor weather alerts via NOAA radio\n2. Activate tornado warning PA announcement\n3. Move all students to interior hallways on ground floor\n4. Students assume duck and cover position\n5. Close all doors and stay away from windows\n6. Take attendance\n7. Monitor weather radio for all-clear\n8. Check for injuries after event\n9. Assess building for structural damage before resuming\n10. Contact parents if dismissal is delayed', 'VP Richardson, Maintenance Lead Turner', '2026-03-01'],
      ['Medical Emergency Response', 'Medical Emergency', 'Protocols for responding to student or staff medical emergencies including allergic reactions, seizures, and cardiac events.', '1. Call 911 immediately for life-threatening emergencies\n2. Notify school nurse via radio/phone\n3. Administer first aid if trained\n4. Use AED if cardiac arrest (located in main hallway, gym, cafeteria)\n5. Administer EpiPen for known anaphylaxis\n6. Clear area around patient\n7. Assign student to guide EMS to location\n8. Contact parents/emergency contacts\n9. Document incident details\n10. Provide follow-up care information', 'Nurse Campbell, Athletic Director Harper', '2026-02-28'],
      ['Bomb Threat Response', 'Bomb Threat', 'Procedures for handling bomb threats received by phone, written communication, or electronic means.', '1. Keep caller on line as long as possible\n2. Note exact words, background sounds, caller characteristics\n3. Fill out bomb threat checklist\n4. Notify principal immediately\n5. Call 911\n6. Do NOT use radios or cell phones near suspected area\n7. Evacuate to off-site location (Community Center)\n8. Do NOT touch suspicious packages\n9. Allow bomb squad to clear building\n10. Document all details for law enforcement', 'Principal Martinez, SRO Officer Brooks', '2026-01-10'],
      ['Hazardous Material Spill', 'HAZMAT', 'Response procedures for chemical spills or hazardous material exposure in science labs or facility areas.', '1. Evacuate immediate area\n2. Identify chemical if possible (check SDS sheets)\n3. Notify facilities manager\n4. Call 911 if exposure risk is high\n5. Seal off affected area\n6. Turn off HVAC in affected zone\n7. Provide first aid for exposed individuals\n8. Use spill kit for minor contained spills\n9. Document chemicals involved\n10. Professional cleanup for major spills', 'Science Dept. Chair Dr. Nguyen, Facilities Manager Ross', '2026-03-10'],
      ['Lockout Protocol', 'External Threat', 'Procedures when a threat exists outside the school building but does not require full lockdown.', '1. Announce lockout via PA system\n2. Bring all outdoor activities inside\n3. Lock all exterior doors\n4. Continue normal indoor activities\n5. Post staff at all entrances\n6. Monitor situation via police communication\n7. Restrict visitor access\n8. Notify parents via text alert\n9. Resume normal operations when threat clears\n10. Debrief staff after event', 'AP Richardson, Security Team Lead', '2026-02-01'],
      ['Earthquake Response Plan', 'Earthquake', 'Procedures for earthquake events including drop-cover-hold, evacuation, and building assessment protocols.', '1. DROP, COVER, and HOLD ON\n2. Stay away from windows and heavy objects\n3. If outdoors, move to open area\n4. After shaking stops, check for injuries\n5. Evacuate building using fire evacuation routes\n6. Watch for falling debris\n7. Assemble at designated areas\n8. Take attendance\n9. Do not re-enter until structural assessment complete\n10. Prepare for aftershocks', 'Facilities Manager Ross, Principal Martinez', '2026-01-25'],
      ['Student Reunification Plan', 'Reunification', 'Detailed procedures for reunifying students with parents/guardians after an emergency evacuation or extended lockdown.', '1. Set up reunification site at Community Center\n2. Establish check-in and check-out stations\n3. Verify parent/guardian identity with photo ID\n4. Cross-reference emergency contact lists\n5. Release students only to authorized individuals\n6. Track all student releases in writing\n7. Provide emotional support resources\n8. Communicate updates via parent portal\n9. Arrange transportation for unclaimed students\n10. Debrief and document', 'Counselor Johnson, Office Manager Miller', '2026-03-05'],
      ['Pandemic Response Protocol', 'Pandemic/Health Crisis', 'Comprehensive plan for responding to pandemic or widespread illness affecting the school community.', '1. Activate health emergency team\n2. Coordinate with local health department\n3. Implement enhanced cleaning protocols\n4. Set up isolation room for symptomatic individuals\n5. Activate remote learning contingency\n6. Monitor absence rates for threshold triggers\n7. Communicate with parents about symptoms to watch for\n8. Restrict visitors and assemblies\n9. Ensure PPE supply is adequate\n10. Follow health department guidance for closures', 'Nurse Campbell, Principal Martinez', '2026-03-15'],
      ['Utility Failure Response', 'Infrastructure', 'Procedures for responding to power outages, water main breaks, gas leaks, and other utility failures.', '1. Assess scope of utility failure\n2. For gas leak: evacuate immediately, call gas company and 911\n3. For power outage: activate backup generators\n4. For water failure: distribute bottled water, limit restroom use\n5. Contact utility provider for restoration estimate\n6. Notify district office\n7. Determine if early dismissal is needed\n8. Activate parent notification system\n9. Ensure emergency lighting is functional\n10. Document duration and impact', 'Facilities Manager Ross, Maintenance Lead Turner', '2026-02-20'],
      ['Intruder on Campus Protocol', 'Intruder', 'Step-by-step procedures for managing an unauthorized individual discovered on school grounds.', '1. Staff member approaches individual calmly\n2. Ask for identification and purpose of visit\n3. If cooperative, escort to main office for check-in\n4. If uncooperative or threatening, do not confront\n5. Call office to report location and description\n6. Activate lockout or lockdown as appropriate\n7. Call 911 if individual is threatening\n8. Monitor individual from safe distance\n9. Do not allow access to students\n10. Document incident fully', 'SRO Officer Brooks, Security Team', '2026-03-20'],
      ['Bus Emergency Evacuation', 'Transportation', 'Emergency procedures for bus accidents, breakdowns, or threats during student transportation.', '1. Bus driver assesses situation and calls dispatch\n2. Evacuate bus if fire, smoke, or imminent danger\n3. Use front and rear emergency exits\n4. Move students 100 feet from bus\n5. Take attendance from route sheet\n6. Call 911 for injuries or hazards\n7. Notify school transportation office\n8. Arrange replacement transportation\n9. Contact parents of affected students\n10. Complete accident report', 'Transportation Dir. Lewis, Bus Driver Supervisors', '2026-02-10'],
      ['Suicide Threat Response', 'Mental Health Crisis', 'Protocol for responding to students expressing suicidal ideation or making suicide attempts on campus.', '1. Stay with the student at all times\n2. Listen without judgment\n3. Remove access to any means of harm\n4. Call school counselor immediately\n5. Call 911 if imminent danger\n6. Contact parents/guardians\n7. Do not leave student alone even after crisis appears resolved\n8. Document all statements and actions\n9. Arrange professional mental health evaluation\n10. Develop safety plan before student returns to class', 'Counselor Johnson, Counselor Patel, Nurse Campbell', '2026-03-25'],
      ['Campus Violence De-escalation', 'Violence Prevention', 'Trained response procedures for de-escalating violent situations between students or involving visitors.', '1. Remain calm and maintain safe distance\n2. Use calm, clear verbal commands\n3. Do not physically intervene unless trained\n4. Remove bystanders from area\n5. Call for backup from trained staff\n6. Document the situation as it unfolds\n7. Once de-escalated, separate involved parties\n8. Provide medical attention if needed\n9. Notify parents and administration\n10. File incident report and conduct follow-up', 'SRO Officer Brooks, Counselor Anderson, Trained Staff', '2026-03-30'],
    ];
    for (const e of emergencyPlans) {
      await client.query(
        `INSERT INTO emergency_plans (title, emergency_type, description, procedures, responsible_staff, last_updated) VALUES ($1,$2,$3,$4,$5,$6)`,
        e
      );
    }

    // Seed visitor_logs
    const visitors = [
      ['John Peterson', 'Parent-Teacher Conference', 'Mrs. Thompson', '09:00', '10:30', true, 1],
      ['Sarah Mitchell', 'Volunteer - Library', 'Librarian Ford', '08:30', '12:00', true, 0],
      ['Robert Garcia', 'Maintenance Contractor', 'Facilities Manager Ross', '07:00', '16:00', true, 2],
      ['Lisa Wong', 'Guest Speaker - Career Day', 'Counselor Johnson', '10:00', '14:00', true, 0],
      ['Michael Torres', 'Food Delivery - Catering', 'Cafeteria Manager Green', '06:30', '07:30', true, 1],
      ['Angela Foster', 'Student Pickup - Early Dismissal', 'Office Staff', '11:00', '11:15', true, 0],
      ['David Kaminski', 'IT Equipment Installation', 'IT Director Walsh', '09:30', '15:00', true, 1],
      ['Patricia Nguyen', 'School Board Member Visit', 'Principal Martinez', '08:00', '12:00', true, 0],
      ['James Unknown', 'Refused to State', 'N/A', '10:45', null, false, 8],
      ['Maria Santos', 'PTA Meeting', 'PTA President Robinson', '18:00', '20:00', true, 0],
      ['Kevin O Brien', 'Fire Inspector', 'Facilities Manager Ross', '13:00', '16:00', true, 0],
      ['Rachel Adams', 'Substitute Teacher', 'AP Richardson', '07:15', '15:30', true, 0],
      ['Thomas Blake', 'Textbook Delivery', 'Office Manager Miller', '10:00', '10:30', true, 1],
      ['Unknown Male', 'Did not check in - found in hallway', 'Security', '14:20', '14:35', false, 9],
      ['Diana Cruz', 'Counselor - External Agency', 'Counselor Patel', '09:00', '11:00', true, 0],
    ];
    for (const v of visitors) {
      await client.query(
        `INSERT INTO visitor_logs (visitor_name, purpose, host_staff, check_in, check_out, id_verified, risk_score) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        v
      );
    }

    // Seed safety_audits
    const audits = [
      ['Main Entrance Security', 'Physical Security', 'Metal detector functioning properly. Visitor check-in system operational. Camera coverage adequate. Signage needs updating.', 'medium', 'Update signage to reflect new visitor policy. Add second camera angle at entrance. Consider adding bollards for vehicle barrier.', 'Inspector Williams', '2026-03-01'],
      ['Science Laboratory - Building B', 'Chemical Safety', 'Chemical storage cabinet not properly secured. Emergency eyewash station tested and functional. Ventilation hood needs filter replacement.', 'high', 'Replace cabinet lock immediately. Schedule ventilation hood filter replacement. Update chemical inventory log.', 'Safety Officer Hernandez', '2026-03-05'],
      ['Fire Extinguisher Inspection', 'Fire Safety', 'All 47 fire extinguishers inspected. 3 units in Building A past service date. All units properly mounted and accessible.', 'low', 'Replace 3 expired units in Building A (rooms 102, 115, 201). Schedule next inspection for September.', 'Fire Inspector O Brien', '2026-03-10'],
      ['Playground Equipment', 'Physical Safety', 'Swing set chain showing wear on 2 of 6 swings. Rubber surfacing adequate. Slide mounting bolts tight. Climbing structure paint peeling.', 'medium', 'Replace worn swing chains within 2 weeks. Schedule repainting of climbing structure. Monitor rubber surface depth.', 'Inspector Williams', '2026-03-12'],
      ['Security Camera System', 'Surveillance', 'Of 64 cameras, 58 operational. 4 cameras offline in Building C. 2 cameras with poor night vision. Recording system at 80% storage capacity.', 'high', 'Repair 4 offline cameras immediately. Replace 2 degraded night vision units. Expand storage capacity or adjust retention policy.', 'IT Director Walsh', '2026-03-15'],
      ['Emergency Exit Routes', 'Fire Safety', 'All 24 emergency exits inspected. 2 exits in Building B had obstructed pathways. All exit signs illuminated. Emergency lighting functional.', 'medium', 'Clear obstructions at exits B-3 and B-7 immediately. Add floor-level exit signs in Building C corridors.', 'Fire Marshal Davis', '2026-03-18'],
      ['Cafeteria Kitchen', 'Health & Safety', 'Food storage temperatures within range. Grease trap needs cleaning. Fire suppression system inspected and current. Floor non-slip coating wearing.', 'medium', 'Schedule grease trap cleaning this week. Plan floor re-coating for summer break. Verify all food handler certifications current.', 'Health Inspector Thompson', '2026-03-20'],
      ['Athletic Facilities', 'Physical Safety', 'Gymnasium floor in good condition. Weight room equipment maintained. Pool chemical levels proper. Locker room ventilation inadequate.', 'medium', 'Improve locker room ventilation system. Add defibrillator to pool area. Update weight room safety signage.', 'Athletic Director Harper', '2026-03-22'],
      ['Parking Lot and Driveways', 'Traffic Safety', 'Faded lane markings in student lot. Speed bumps in good condition. Loading zone signage adequate. No security camera coverage in staff lot.', 'medium', 'Repaint lane markings. Install 2 cameras in staff parking lot. Add reflective delineators at lot entrance.', 'Facilities Manager Ross', '2026-03-25'],
      ['HVAC System', 'Indoor Air Quality', 'Air filters replaced on schedule. CO2 levels within acceptable range. Three classrooms in Building A showing elevated humidity levels.', 'low', 'Address humidity issues in Building A rooms 201-203. Consider upgrading to MERV-13 filters. Schedule duct cleaning.', 'HVAC Technician Roberts', '2026-03-27'],
      ['Perimeter Fencing', 'Physical Security', 'Full perimeter walk completed. South fence section damaged (10ft gap). East gate latch broken. West fence in good condition. North fence adequate.', 'high', 'Repair south fence immediately - safety hazard. Fix east gate latch. Consider adding fence-mounted intrusion detection.', 'Security Consultant Grant', '2026-03-28'],
      ['Classroom Door Locks', 'Physical Security', 'Tested all 85 classroom door locks. 7 doors have locks that require key from both sides (not to code). All doors close and latch properly.', 'high', 'Replace 7 non-compliant locks with classroom security locks (lockable from inside). Priority: Building A and B ground floors.', 'Locksmith Anderson', '2026-04-01'],
      ['First Aid Supplies', 'Medical Preparedness', 'Inspected 12 first aid stations. 3 stations missing supplies. AED units (5) all tested and current. Nurse office fully stocked.', 'low', 'Restock 3 depleted first aid stations. Order additional EpiPens for cafeteria station. Update first aid contents checklist.', 'Nurse Campbell', '2026-04-03'],
      ['Communication System', 'Emergency Communication', 'PA system functional in all buildings. Intercom has dead zones in Building C basement. Two-way radios all charged and functional.', 'medium', 'Install PA speaker in Building C basement. Purchase 5 additional radios for new staff. Test mass notification system monthly.', 'IT Director Walsh', '2026-04-05'],
      ['Stairwells and Corridors', 'Physical Safety', 'Handrails secure. Lighting adequate except Building B stairwell 3. Non-slip treads in good condition. Some corridor floor tiles loose.', 'low', 'Replace light fixtures in Building B stairwell 3. Repair loose floor tiles in Building A main corridor. Add reflective tape to stairs.', 'Maintenance Lead Turner', '2026-04-07'],
    ];
    for (const a of audits) {
      await client.query(
        `INSERT INTO safety_audits (area, audit_type, findings, risk_rating, recommendations, auditor, audit_date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        a
      );
    }

    // Seed training_programs
    const trainings = [
      ['Active Shooter Response Training', 'Emergency Response', 'Comprehensive training on ALICE protocol (Alert, Lockdown, Inform, Counter, Evacuate) for all staff members.', 'All Staff', '4 hours', 85, '2026-05-15'],
      ['CPR and First Aid Certification', 'Medical', 'American Red Cross certified CPR, AED, and First Aid training for teachers and support staff.', 'Teachers & Support Staff', '8 hours', 72, '2026-04-20'],
      ['De-escalation Techniques', 'Behavioral', 'Training on verbal de-escalation strategies for managing aggressive or distressed students.', 'Teachers & Counselors', '3 hours', 90, '2026-05-01'],
      ['Bullying Prevention Workshop', 'Student Safety', 'Evidence-based bullying prevention strategies including identification, intervention, and reporting procedures.', 'All Staff', '2 hours', 95, '2026-04-25'],
      ['Threat Assessment Team Training', 'Security', 'Advanced training for threat assessment team members on evaluating and responding to potential threats.', 'Threat Assessment Team', '6 hours', 100, '2026-06-01'],
      ['Mandated Reporter Training', 'Legal Compliance', 'Annual training on mandated reporting requirements for suspected child abuse and neglect.', 'All Staff', '2 hours', 88, '2026-04-15'],
      ['Fire Safety and Evacuation', 'Emergency Response', 'Training on fire prevention, extinguisher use, and evacuation procedures for all buildings.', 'All Staff', '2 hours', 92, '2026-05-10'],
      ['Mental Health First Aid', 'Mental Health', 'Certification course teaching staff to identify, understand, and respond to signs of mental health challenges in students.', 'Teachers & Counselors', '8 hours', 65, '2026-05-20'],
      ['Cybersecurity Awareness', 'Technology', 'Training on recognizing phishing attempts, protecting student data, and maintaining digital safety.', 'All Staff', '1.5 hours', 78, '2026-04-30'],
      ['Trauma-Informed Teaching', 'Behavioral', 'Understanding the impact of trauma on student behavior and learning, with practical classroom strategies.', 'Teachers', '4 hours', 70, '2026-06-05'],
      ['Emergency Communication Systems', 'Emergency Response', 'Training on PA system, two-way radios, mass notification system, and emergency communication protocols.', 'Office Staff & Admin', '2 hours', 82, '2026-05-25'],
      ['Substance Abuse Recognition', 'Student Safety', 'Identifying signs of substance abuse in students and understanding referral procedures.', 'Teachers & Counselors', '3 hours', 60, '2026-06-10'],
      ['Visitor Management Procedures', 'Security', 'Proper procedures for visitor check-in, badge issuance, and managing unauthorized visitors.', 'Office & Security Staff', '1 hour', 98, '2026-04-18'],
      ['Inclusive Safety Practices', 'Diversity & Safety', 'Training on ensuring safety procedures accommodate students with disabilities and special needs.', 'All Staff', '2 hours', 55, '2026-06-15'],
      ['Crisis Communication for Parents', 'Communication', 'Training admin staff on effective crisis communication strategies for parent and community notification.', 'Admin & Office Staff', '2 hours', 88, '2026-05-05'],
    ];
    for (const t of trainings) {
      await client.query(
        `INSERT INTO training_programs (title, category, description, target_audience, duration, completion_rate, next_session) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        t
      );
    }

    // Seed bullying_reports
    const bullyingReports = [
      ['student', '6th', '7th', 'Physical', 'Victim was pushed into lockers by an older student between classes. This is the third reported incident this month involving the same aggressor.', 'Hallway - Building A', 'Aggressor given 2-day suspension. Parents of both students notified. Counseling referral made.'],
      ['teacher', '4th', '4th', 'Verbal', 'Student repeatedly calling another student derogatory names related to their weight during PE class. Other students have joined in.', 'Gymnasium', 'Class discussion on bullying conducted. Aggressor given lunch detention. Both students referred to counselor.'],
      ['parent', '8th', '9th', 'Cyberbullying', 'Parent reported that their child is receiving threatening messages via Instagram from older students. Screenshots provided.', 'Online / School Campus', 'School contacted social media platform. Aggressors identified and suspended. Police report filed due to threat content.'],
      ['student', '5th', '5th', 'Social Exclusion', 'Group of students deliberately excluding victim from all activities and spreading rumors. Victim reported feeling unsafe at school.', 'Classroom / Playground', 'Restorative justice circle planned. Group counseling for aggressors. Daily check-ins with victim established.'],
      ['teacher', '10th', '10th', 'Verbal', 'Student making repeated homophobic remarks toward a classmate. Behavior escalating despite previous warnings.', 'Classroom - Room 302', 'Progressive discipline applied. Anti-harassment policy reviewed with student and parents. Referred to counselor.'],
      ['anonymous', '3rd', '5th', 'Physical', 'Anonymous report of older students taking younger student lunch money on the bus daily. Victim too afraid to report.', 'School Bus #7', 'Bus camera footage reviewed. Aggressors identified. Bus privileges suspended for 2 weeks. Restitution required.'],
      ['student', '9th', '9th', 'Cyberbullying', 'Embarrassing photo of student shared without consent on group chat with 50+ students. Photo taken in locker room.', 'Online / Locker Room', 'IMMEDIATE: Photo distribution is potential criminal offense. Police notified. All identified distributors suspended. Device confiscation.'],
      ['parent', '7th', '8th', 'Intimidation', 'Student being threatened and forced to give up lunch and personal items by a group of older students. Ongoing for several weeks.', 'Cafeteria / Hallways', 'Aggressors identified through surveillance. 3-day suspension issued. Safety plan for victim. Lunch period schedule adjusted.'],
      ['teacher', '11th', '11th', 'Harassment', 'Repeated sexual harassment of a female student by male classmate including unwanted touching and inappropriate comments.', 'Multiple Classrooms', 'Title IX investigation initiated. Aggressor removed from shared classes. No-contact order issued. Parents and police notified.'],
      ['student', '6th', '6th', 'Relational', 'Student creating fake social media accounts impersonating the victim and posting embarrassing content.', 'Online', 'Fake accounts reported and removed. Aggressor admitted responsibility. 3-day suspension. Digital citizenship lesson for grade.'],
      ['counselor', '2nd', '3rd', 'Physical', 'Younger student being pinched and hit by older student during recess. Victim has bruises on arms.', 'Playground', 'Recess schedules separated. Aggressor assigned indoor recess with counseling. Photos of injuries documented. Parents notified.'],
      ['parent', '5th', '5th', 'Verbal', 'Student with speech impediment being mocked by classmates who imitate and ridicule their speech pattern.', 'Classroom - Room 108', 'Disability awareness lesson conducted. Individual meetings with aggressors. Speech therapist consulted on support strategies.'],
      ['student', '12th', '12th', 'Social Media', 'Threatening messages posted on student-run anonymous confession page targeting specific student by name.', 'Online', 'Page administrators identified. Content removed. Threat assessment conducted. Targeted student offered support services.'],
      ['teacher', '8th', '8th', 'Extortion', 'Student being forced to complete homework assignments for aggressors under threat of physical harm.', 'Library / Hallways', 'Aggressors given 5-day suspension. Academic integrity review for affected assignments. Victim receiving counseling.'],
      ['parent', '1st', '2nd', 'Physical', 'First grader coming home with scratches and torn clothing. Child finally disclosed being attacked by second grader at recess.', 'Playground', 'Immediate recess supervision increased. Aggressor behavior plan implemented. Parent conference with both families. Monitor daily.'],
    ];
    for (const b of bullyingReports) {
      await client.query(
        `INSERT INTO bullying_reports (reporter_type, victim_grade, bully_grade, incident_type, description, location, action_taken) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        b
      );
    }

    // Seed mental_health_screenings
    const mentalHealth = [
      ['Emma Wilson', '9th', 'PHQ-9 Depression Screening', 'Moderate depressive symptoms. Score: 14/27. Reports persistent sadness, loss of interest in activities, difficulty sleeping.', 'Weekly check-ins with school counselor. Referral to outside therapist. Parent notification and collaboration.', '2026-04-20', 'Counselor Johnson'],
      ['James Rodriguez', '11th', 'GAD-7 Anxiety Screening', 'Severe anxiety symptoms. Score: 18/21. Excessive worry about grades, college admissions, and social situations. Panic attacks reported.', 'Immediate referral to psychiatrist for medication evaluation. Implement test accommodations. Relaxation techniques training.', '2026-04-15', 'Counselor Patel'],
      ['Sophia Kim', '7th', 'Columbia Suicide Severity Rating', 'Passive suicidal ideation reported without plan or intent. History of self-harm. Recent family disruption.', 'Safety plan created. Daily check-ins. Outside therapist appointment scheduled. Parents engaged in safety planning.', '2026-04-12', 'Counselor Johnson'],
      ['Ethan Thompson', '5th', 'Behavioral Assessment', 'Elevated scores on conduct problems and hyperactivity scales. Attention difficulties impacting academic performance.', 'Refer for ADHD evaluation. Implement classroom accommodations. Behavioral reward system. Parent consultation.', '2026-05-01', 'School Psychologist Dr. Lee'],
      ['Olivia Davis', '10th', 'Eating Disorder Screen', 'At-risk indicators for anorexia nervosa. BMI below 5th percentile. Restrictive eating patterns. Excessive exercise.', 'Medical referral to pediatrician. Nutritionist consultation. Weekly weigh-ins with nurse. Individual therapy referral.', '2026-04-18', 'Nurse Campbell'],
      ['Liam Foster', '3rd', 'Trauma Screening - CATS', 'Elevated trauma symptoms following witnessed domestic violence. Nightmares, hypervigilance, emotional numbing.', 'Trauma-focused CBT referral. Create safe space in classroom. Avoid sudden loud noises. Weekly art therapy sessions.', '2026-04-25', 'School Psychologist Dr. Lee'],
      ['Ava Martinez', '8th', 'PHQ-A Adolescent Depression', 'Mild to moderate symptoms. Score: 11/27. Social isolation increasing. Grades declining. Reported family financial stress.', 'Bi-weekly counseling sessions. Connect family with community resources. Monitor academic progress. Peer support group.', '2026-05-05', 'Counselor Patel'],
      ['Noah Brown', '4th', 'Social-Emotional Screening', 'Significant deficits in social skills and emotion regulation. Difficulty making friends. Frequent meltdowns when frustrated.', 'Social skills group enrollment. Emotion regulation curriculum. Consult with special education team. Parent training offered.', '2026-05-10', 'School Psychologist Dr. Lee'],
      ['Isabella Chang', '12th', 'Stress Assessment', 'Severe academic stress related to college applications and AP coursework. Sleep deprivation. Physical symptoms of stress.', 'Time management coaching. Reduce course load if possible. Mindfulness training. Connect with college counselor for perspective.', '2026-04-22', 'Counselor Johnson'],
      ['Mason Williams', '6th', 'Grief Assessment', 'Student lost parent 3 months ago. Displaying complicated grief symptoms. Withdrawn, angry outbursts, declining grades.', 'Grief counseling referral. Support group for bereaved students. Flexible academic deadlines. Regular check-ins.', '2026-05-15', 'Counselor Patel'],
      ['Charlotte Moore', '2nd', 'Separation Anxiety Assessment', 'Severe separation anxiety. Refuses to attend school. Physical complaints (stomachache, headache) every morning. Clings to parent.', 'Graduated exposure plan. Morning routine structure. Reward system for school attendance. Parent guidance on separation.', '2026-04-28', 'School Psychologist Dr. Lee'],
      ['Aiden Taylor', '10th', 'Substance Use Screening - CRAFFT', 'Positive screen for problematic substance use. Score: 4/6. Reports regular marijuana and alcohol use on weekends.', 'Substance abuse counselor referral. Motivational interviewing sessions. Drug testing agreement with parents. Support group.', '2026-05-08', 'Counselor Johnson'],
      ['Mia Gonzalez', '9th', 'Self-Harm Assessment', 'Active self-harm behaviors (cutting). Has been hiding injuries. Triggered by peer conflict and family arguments.', 'Safety plan with alternative coping strategies. Remove access to sharp objects at school. Intensive therapy referral. Weekly wound checks.', '2026-04-14', 'Counselor Patel'],
      ['Lucas Anderson', '7th', 'Anger Management Assessment', 'Significant anger management issues. Three physical altercations this semester. Difficulty with impulse control.', 'Anger management group. Individual CBT sessions. Behavior contract. Check-in/check-out system daily.', '2026-05-20', 'School Psychologist Dr. Lee'],
      ['Zoe Peterson', '11th', 'Social Anxiety Assessment', 'Severe social anxiety preventing class participation. Avoids cafeteria and group projects. Academic impact significant.', 'Gradual exposure hierarchy. Accommodations for presentations. Small group lunch option. Anxiety-focused therapy referral.', '2026-05-12', 'Counselor Johnson'],
    ];
    for (const m of mentalHealth) {
      await client.query(
        `INSERT INTO mental_health_screenings (student_name, grade, screening_type, risk_indicators, recommendations, follow_up_date, counselor) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        m
      );
    }

    // Seed anonymous_tips
    const tips = [
      ['Weapons', 'I saw a student in 10th grade showing what looked like a knife to his friends behind the gym during lunch. He put it back in his backpack.', 'critical', 'new', 'Behind gymnasium'],
      ['Drugs', 'There are students selling vape cartridges in the boys bathroom near the science wing during passing periods. It happens almost every day.', 'high', 'reviewing', 'Building B - Science Wing Restroom'],
      ['Bullying', 'A group of 8th graders have been threatening a 6th grader every day after school by the bike racks. They take his phone and bag.', 'high', 'actionable', 'Bike rack area - south entrance'],
      ['Safety Concern', 'The emergency exit door by the art room has been propped open every day this week. Anyone could walk in without being seen.', 'medium', 'resolved', 'Art room emergency exit - Building C'],
      ['Threat', 'Overheard two students talking about getting revenge on Mr. Henderson. They seemed really angry and one said something about making him pay.', 'critical', 'investigating', 'Hallway near Room 204'],
      ['Vandalism', 'Someone has been breaking into the storage shed by the football field at night. I saw flashlights there around midnight last Tuesday.', 'low', 'reviewing', 'Football field storage shed'],
      ['Mental Health', 'My friend has been talking about not wanting to be alive anymore. They made me promise not to tell but I am really worried about them. They are in 11th grade.', 'critical', 'actionable', 'No specific location'],
      ['Substance Abuse', 'A senior student has been coming to school drunk almost every morning. Their locker is near room 301 and you can smell alcohol.', 'high', 'reviewing', 'Building A - near Room 301'],
      ['Suspicious Activity', 'There is a man who parks his car across the street from school every afternoon and watches students leave. White sedan, older model. Been there for two weeks.', 'high', 'investigating', 'Street opposite main entrance'],
      ['Fighting', 'There is going to be a big fight planned for Friday after school at the park across from school. Multiple students from different grades are talking about it.', 'high', 'actionable', 'Park adjacent to school'],
      ['Theft', 'Someone has been stealing from the girls locker room during 4th period PE. Multiple students have had money and electronics taken.', 'medium', 'reviewing', 'Girls locker room - Gymnasium'],
      ['Harassment', 'A teacher has been making inappropriate comments to female students in their class. Multiple girls feel uncomfortable but are afraid to report it officially.', 'critical', 'investigating', 'Not specified - protecting identity'],
      ['Safety Hazard', 'The railing on the second floor of Building B is loose and wobbles when you lean on it. Someone is going to fall eventually.', 'medium', 'actionable', 'Building B - 2nd floor railing'],
      ['Gang Activity', 'New gang tagging appeared on the walls near the loading dock. Colors and symbols match local gang. Students are being pressured to join.', 'high', 'investigating', 'Loading dock area'],
      ['Cheating', 'Students have been using AI to write their papers and a group has figured out how to access answer keys through a vulnerability in the school testing system.', 'medium', 'new', 'Computer lab / online'],
    ];
    for (const t of tips) {
      await client.query(
        `INSERT INTO anonymous_tips (tip_category, message, priority, status, location_hint) VALUES ($1,$2,$3,$4,$5)`,
        t
      );
    }

    // Seed drill_records
    const drills = [
      ['Fire Evacuation', '2026-01-15', 4, 450, 'Building C evacuation route congested at stairwell 2. Two classrooms slow to respond.', 'satisfactory', '2026-04-15'],
      ['Lockdown', '2026-01-22', 3, 480, 'Room 112 door lock malfunctioned. Three students in hallway not accounted for initially.', 'needs improvement', '2026-04-22'],
      ['Tornado Shelter', '2026-02-05', 6, 460, 'Students in gymnasium slow to reach shelter areas. Need clearer signage in athletic wing.', 'satisfactory', '2026-05-05'],
      ['Fire Evacuation', '2026-02-18', 3, 455, 'Improved time from January drill. All classes evacuated within target time. No issues.', 'excellent', '2026-05-18'],
      ['Lockdown', '2026-03-01', 2, 470, 'All doors secured within 45 seconds. Communication system worked well. Minor issue with PA in Building C.', 'good', '2026-06-01'],
      ['Earthquake Drop-Cover-Hold', '2026-03-10', 5, 440, 'Several students did not take drill seriously. Some under desks improperly. Need reinforcement training.', 'needs improvement', '2026-06-10'],
      ['Bus Evacuation', '2026-03-15', 8, 120, 'Front exit evacuation smooth. Rear exit needed practice. Students with disabilities need more support.', 'satisfactory', '2026-06-15'],
      ['Active Shooter - ALICE', '2026-03-20', 15, 465, 'Staff response improved significantly. Counter techniques need more practice. Three new staff unfamiliar with protocol.', 'good', '2026-06-20'],
      ['Shelter in Place', '2026-03-25', 4, 475, 'HVAC shutdown procedure took too long. Classroom sealing materials readily available. Communication clear.', 'satisfactory', '2026-06-25'],
      ['Fire Evacuation', '2026-04-01', 3, 458, 'Best time this year. All buildings evacuated in under 3 minutes. Assembly point attendance efficient.', 'excellent', '2026-07-01'],
      ['Reunification', '2026-04-05', 45, 200, 'Parent check-in process too slow. Need more ID verification stations. Communication to parents delayed.', 'needs improvement', '2026-07-05'],
      ['Lockdown', '2026-04-08', 2, 462, 'Fastest lockdown time achieved. All doors secured in 30 seconds. Substitute teachers were briefed and performed well.', 'excellent', '2026-07-08'],
      ['Medical Emergency', '2026-02-12', 10, 25, 'AED training drill. Response time to gymnasium: 2 minutes. Need AED closer to athletic fields.', 'good', '2026-05-12'],
      ['Hazmat Response', '2026-02-25', 12, 85, 'Science wing evacuation completed. Spill containment procedures followed. Ventilation shutdown delayed.', 'satisfactory', '2026-05-25'],
      ['Full Campus Evacuation', '2026-03-28', 18, 490, 'Off-site evacuation to community center. Bus transportation logistics need work. Student accountability at off-site challenging.', 'needs improvement', '2026-06-28'],
    ];
    for (const d of drills) {
      await client.query(
        `INSERT INTO drill_records (drill_type, date, duration_minutes, participants, issues_found, rating, next_drill) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        d
      );
    }

    // Seed access_control_logs
    const accessLogs = [
      ['Main Entrance', 'Student', 'ID Badge', '2026-04-09 07:45:00', true, false, 'Normal morning entry'],
      ['Main Entrance', 'Staff', 'Key Fob', '2026-04-09 07:15:00', true, false, 'Early arrival for staff meeting'],
      ['Side Door - Building B', 'Student', 'ID Badge', '2026-04-09 07:55:00', true, true, 'Student badge reported lost last week - verify identity'],
      ['Loading Dock', 'Vendor', 'Visitor Pass', '2026-04-09 08:30:00', true, false, 'Scheduled food delivery'],
      ['Main Entrance', 'Visitor', 'Sign-in', '2026-04-09 09:00:00', true, false, 'Parent for scheduled conference'],
      ['Emergency Exit - Building A', 'Unknown', 'Forced Entry', '2026-04-09 02:15:00', false, true, 'ALERT: Door forced open after hours. Security dispatched. Alarm triggered.'],
      ['Gymnasium Side Door', 'Student', 'Propped Open', '2026-04-09 12:30:00', true, true, 'Students propping door open during lunch. Policy violation.'],
      ['Main Entrance', 'Staff', 'Key Fob', '2026-04-09 06:45:00', true, false, 'Custodial staff early morning arrival'],
      ['Parking Lot Gate', 'Staff', 'Transponder', '2026-04-09 07:30:00', true, false, 'Normal staff arrival'],
      ['Side Door - Building C', 'Visitor', 'Tailgating', '2026-04-09 10:15:00', false, true, 'Individual followed staff member through secured door without badge'],
      ['Main Entrance', 'Student', 'ID Badge', '2026-04-09 08:05:00', true, true, 'Late arrival - student has pattern of tardiness'],
      ['Administrative Wing', 'Staff', 'Keypad Code', '2026-04-09 16:30:00', true, false, 'After-hours access for grade entry'],
      ['Server Room', 'Staff', 'Biometric', '2026-04-09 14:00:00', true, false, 'IT staff routine maintenance access'],
      ['Main Entrance', 'Visitor', 'Denied', '2026-04-09 11:00:00', false, true, 'Individual refused to show ID or state purpose. Turned away. Description logged.'],
      ['Roof Access', 'Staff', 'Master Key', '2026-04-09 09:30:00', true, false, 'Maintenance inspection of HVAC units'],
    ];
    for (const a of accessLogs) {
      await client.query(
        `INSERT INTO access_control_logs (entry_point, person_type, access_method, timestamp, authorized, flagged, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        a
      );
    }

    // Seed communication_alerts
    const alerts = [
      ['Emergency', 'Lockdown Activated - Building A', 'LOCKDOWN IN EFFECT for Building A. All staff and students shelter in place. Lock doors, move away from windows. Await further instructions from administration.', 'critical', 'All Staff & Students - Building A', '2026-04-08 10:23:00', 'sent'],
      ['Weather', 'Tornado Warning - Shelter Immediately', 'National Weather Service has issued a tornado warning for our area. All students and staff proceed to designated shelter areas immediately.', 'critical', 'All Staff & Students', '2026-03-28 14:15:00', 'sent'],
      ['Schedule', 'Early Dismissal - Wednesday', 'Reminder: School will dismiss 2 hours early on Wednesday for professional development. Buses will depart at 1:00 PM.', 'low', 'Parents & Staff', '2026-04-06 08:00:00', 'sent'],
      ['Safety', 'Updated Visitor Policy', 'Effective immediately, all visitors must present government-issued photo ID and undergo background check screening before campus access.', 'medium', 'All Staff & Parents', '2026-04-01 09:00:00', 'sent'],
      ['Health', 'Flu Outbreak Advisory', 'Multiple cases of influenza reported. If your child shows symptoms (fever, cough, body aches), please keep them home. Enhanced cleaning protocols active.', 'medium', 'Parents', '2026-03-20 07:30:00', 'sent'],
      ['Security', 'Parking Lot Incident - No Threat', 'Earlier police activity in the parking lot was related to a traffic stop. There is no threat to school safety. Normal operations continue.', 'medium', 'Parents & Staff', '2026-04-03 11:45:00', 'sent'],
      ['Emergency', 'Gas Leak Evacuation - Building B', 'Building B has been evacuated due to a reported gas leak. Affected students relocated to the gymnasium. Utility company en route.', 'high', 'Staff & Parents of Building B Students', '2026-03-15 10:00:00', 'sent'],
      ['Drill', 'Monthly Fire Drill Scheduled', 'Monthly fire drill will be conducted tomorrow at approximately 10:00 AM. Please review evacuation routes with your students.', 'low', 'All Staff', '2026-03-31 15:00:00', 'sent'],
      ['Safety', 'Crosswalk Safety Reminder', 'Please use designated crosswalks when dropping off or picking up students. Recent near-miss incidents have been reported at the main entrance.', 'medium', 'Parents', '2026-03-25 07:00:00', 'sent'],
      ['Security', 'Suspicious Activity Report', 'We are aware of reports of suspicious activity near school grounds. Extra security has been assigned. Please report any concerns to the main office.', 'high', 'Parents & Staff', '2026-04-07 13:00:00', 'sent'],
      ['Health', 'Water Quality Notice', 'Routine water testing showed slightly elevated levels in Building C drinking fountains. Bottled water is being provided while retesting is completed.', 'medium', 'Staff & Parents', '2026-03-22 11:00:00', 'sent'],
      ['Emergency', 'All Clear - Resume Normal Operations', 'The lockdown has been lifted. All areas are secure. Normal school operations will resume. Thank you for your cooperation.', 'high', 'All Staff & Students', '2026-04-08 11:05:00', 'sent'],
      ['Training', 'Active Shooter Training Registration', 'Registration is now open for mandatory active shooter response training. All staff must complete by May 15. Sign up through the staff portal.', 'medium', 'All Staff', '2026-04-02 09:00:00', 'sent'],
      ['Schedule', 'Spring Break Safety Tips', 'As we approach spring break, please review our safety tips document sent via email. Report any planned travel to ensure emergency contact accuracy.', 'low', 'Parents & Staff', '2026-03-18 08:00:00', 'sent'],
      ['Security', 'New Security Cameras Installed', 'Additional security cameras have been installed in the parking lots and athletic areas. This enhances our campus monitoring capabilities.', 'low', 'Staff & Parents', '2026-03-10 10:00:00', 'sent'],
    ];
    for (const a of alerts) {
      await client.query(
        `INSERT INTO communication_alerts (alert_type, title, message, priority, target_audience, sent_at, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        a
      );
    }

    // Seed weapon_detections
    const weapons = [
      ['Metal Detector Alert', 'Main Entrance', 'Metal detector activated during morning screening. Student found with a 4-inch pocket knife in backpack. Student claims it was left from a camping trip.', 'medium', 'Knife confiscated. Student detained in office. Parents called. 3-day suspension per policy. Knife turned over to SRO.', 'Metal Detector', 'resolved'],
      ['Visual Identification', 'Parking Lot', 'Security camera captured image of what appears to be a handgun visible in a vehicle glove compartment in the student parking lot.', 'critical', 'Vehicle identified and owner contacted. SRO and local PD responded. Item confirmed as realistic airsoft gun. Vehicle search conducted with consent.', 'Security Camera', 'resolved'],
      ['Student Report', 'Boys Restroom - Building B', 'Student reported seeing another student showing a folding knife to friends in the restroom between classes.', 'high', 'Restroom checked. Student identified and searched. Knife recovered. Expulsion proceedings initiated per zero-tolerance policy.', 'Student Tip', 'resolved'],
      ['Bag Search', 'Athletic Locker Room', 'During routine athletic bag inspection, a set of brass knuckles was found in a student gym bag.', 'medium', 'Item confiscated. Student questioned. Claims item was a gift and forgot it was in bag. 5-day suspension. Parent conference held.', 'Coach Harper', 'resolved'],
      ['Anonymous Tip', 'Not Specified', 'Anonymous tip received stating a student plans to bring a weapon to school tomorrow. Specific student named.', 'critical', 'Police notified. Student home visited by SRO. No weapon found. Student and parents interviewed. Enhanced screening for student upon return.', 'Anonymous Tip Line', 'resolved'],
      ['Metal Detector Alert', 'Main Entrance', 'Repeated metal detector alerts on student. Pat-down revealed a concealed box cutter in jacket pocket.', 'high', 'Box cutter confiscated. Student claimed it was for work at a warehouse job. Policy does not allow exceptions. 5-day suspension.', 'Metal Detector', 'resolved'],
      ['Teacher Report', 'Classroom - Room 205', 'Teacher observed a student with what appeared to be a bullet casing being shown to classmates during study hall.', 'low', 'Item was a spent casing used as a keychain. No weapon present. Student counseled on policy. Item confiscated as precaution.', 'Teacher Morrison', 'resolved'],
      ['Social Media', 'Online / Off-Campus', 'Student posted photo on social media posing with firearms at home with caption referencing school. Multiple reports received.', 'critical', 'Police performed welfare check. Firearms belong to parent and were legally stored. Student suspended pending threat assessment. Social media post removed.', 'Social Media Monitor', 'investigating'],
      ['K-9 Detection', 'Parking Lot', 'During scheduled K-9 sweep, dog alerted on a vehicle in the student lot. Ammunition found in trunk.', 'high', 'Student pulled from class. Vehicle searched with police. Hunting ammunition from weekend trip. No firearm found. Warning issued. Parents notified.', 'K-9 Unit', 'resolved'],
      ['Visual Identification', 'School Perimeter', 'Staff member observed an individual near school fence line who appeared to have a weapon in waistband.', 'critical', 'Immediate lockout initiated. Police responded within 3 minutes. Individual located and detained. Item was a cell phone in holster. All clear issued.', 'Staff Member - Grounds', 'resolved'],
      ['X-Ray Scanner', 'Main Entrance', 'X-ray scanner flagged a bag containing a realistic-looking toy gun during morning screening.', 'medium', 'Toy confiscated. Parent contacted. Student is in 3rd grade - age-appropriate discussion about school safety policy. No suspension - warning issued.', 'X-Ray Operator', 'resolved'],
      ['Student Report', 'School Bus #12', 'Bus driver and students reported a student with a sharp object threatening another student on the bus.', 'high', 'Bus pulled over safely. SRO met bus. Student found with scissors taken from art class. Threatening behavior addressed. Bus suspension and disciplinary action.', 'Bus Driver Patterson', 'resolved'],
      ['Locker Search', 'Locker Bay D', 'During routine locker inspection triggered by drug dog alert, a small utility knife was found.', 'low', 'Knife confiscated. Student stated it was for art projects. Referred to counselor. 1-day in-school suspension. Parents notified.', 'SRO Officer Brooks', 'resolved'],
      ['Metal Detector Alert', 'Athletic Event Entrance', 'Spectator at basketball game triggered metal detector. Concealed carry permit holder had firearm.', 'critical', 'Individual informed of school zone firearm prohibition. Firearm secured in vehicle. Individual allowed to attend after compliance. Police report filed.', 'Event Security', 'resolved'],
      ['Social Media Threat', 'Online', 'Threatening post showing image of weapons with text implying violence toward the school. Posted from anonymous account.', 'critical', 'Law enforcement investigating. Account traced to out-of-district individual. Enhanced security implemented for remainder of week. FBI cyber tip filed.', 'Social Media Monitoring', 'investigating'],
    ];
    for (const w of weapons) {
      await client.query(
        `INSERT INTO weapon_detections (detection_type, location, description, threat_level, response_action, detected_by, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        w
      );
    }

    // Seed community_risks
    const communityRisks = [
      ['Crime', 'North Neighborhood', 'Increase in property crimes reported within a half-mile radius of school. Three break-ins at businesses on school walking routes.', 'medium', 'Coordinate with local PD for increased patrols. Alert parents about safe walking routes. Consider crossing guard at Oak Street.', 'SRO Officer Brooks', '2026-03-15'],
      ['Sex Offender', 'Pine Street Area', 'Registered sex offender recently relocated to address within 1000 feet of school boundary. Level 2 offender.', 'high', 'Notification sent to parents per Megan Law. Photos distributed to all staff. Monitoring plan established with police. Verify compliance with restrictions.', 'Police Liaison', '2026-03-20'],
      ['Drug Activity', 'Elm Park', 'Park adjacent to school property showing signs of drug activity. Paraphernalia found by groundskeeper. Students use park path as walking route.', 'high', 'Report to police narcotics unit. Route students away from park. Install additional lighting. Community cleanup organized.', 'Groundskeeper Adams', '2026-03-25'],
      ['Traffic Safety', 'Main Street Intersection', 'Three pedestrian near-miss incidents at the Main Street crosswalk during school hours in the past month. No crossing guard assigned.', 'medium', 'Request crossing guard from city. Install flashing beacon. Send traffic safety reminder to parents. Explore alternative drop-off route.', 'Transportation Dir. Lewis', '2026-04-01'],
      ['Gang Activity', 'South District', 'Local police report increased gang recruitment activity in neighborhoods feeding into school. Graffiti and tagging appearing.', 'high', 'Gang awareness training for staff. Guest speakers from gang intervention program. Increased monitoring for gang indicators. Parent information sessions.', 'SRO Officer Brooks', '2026-04-05'],
      ['Construction Zone', 'West Campus Adjacent', 'Major construction project beginning next to school property. Heavy equipment, open excavations, and increased truck traffic expected for 6 months.', 'medium', 'Secure construction site perimeter fencing verification. Adjust bus routes to avoid construction traffic. Dust and noise mitigation plan reviewed.', 'Facilities Manager Ross', '2026-04-03'],
      ['Domestic Violence', 'Multiple Areas', 'Three students from same neighborhood have shown signs consistent with witnessing domestic violence at home. Community reports corroborate.', 'high', 'CPS referrals initiated. Counseling services offered. Connect families with domestic violence resources. Staff awareness training on signs.', 'Counselor Johnson', '2026-03-28'],
      ['Environmental', 'Industrial Area - East', 'Chemical plant 2 miles east of school had minor release incident. Air quality concerns raised by parents.', 'medium', 'Install air quality monitoring. Establish communication protocol with plant safety officer. Indoor air filtration reviewed. Emergency shelter plan updated.', 'Principal Martinez', '2026-04-02'],
      ['Social Media Threats', 'Online / Community-wide', 'Multiple schools in district receiving online threats via anonymous social media platforms. Pattern suggests coordinated activity.', 'high', 'Enhanced social media monitoring. Coordinate with district security and FBI. Increase visible security presence. Parent communication sent.', 'IT Director Walsh', '2026-04-07'],
      ['Homeless Encampment', 'Wooded Area - North', 'Homeless encampment discovered in wooded area adjacent to school athletic fields. Reports of individuals crossing school property.', 'medium', 'Fence repair and extension in progress. Social services contacted. Police conducting welfare checks. Restrict student access to wooded area.', 'Groundskeeper Adams', '2026-03-30'],
      ['Mental Health Crisis', 'Community-wide', 'Community mental health center reports 40% increase in youth crisis interventions in our catchment area over the past quarter.', 'high', 'Expand school counseling hours. Host community mental health resource fair. Train all staff in mental health first aid. Increase screening frequency.', 'Counselor Patel', '2026-04-06'],
      ['Road Conditions', 'School Access Roads', 'Multiple potholes and damaged road surfaces on primary school access roads. Two vehicle damage reports from staff.', 'low', 'Filed repair requests with city public works. Temporary warning cones placed. Speed limit reduction requested. Alternative route communication.', 'Facilities Manager Ross', '2026-04-04'],
      ['Predatory Behavior', 'Shopping Center - South', 'Reports of adult approaching students at shopping center near school. Two separate incidents reported to police.', 'critical', 'Police investigation active. Student safety bulletin issued. Buddy system encouraged. Surveillance footage requested from shopping center.', 'SRO Officer Brooks', '2026-04-08'],
      ['Vaping Epidemic', 'Community-wide', 'Local health department reports sharp increase in teen vaping. Several stores near school identified as selling to minors.', 'medium', 'Health education campaign launched. Random searches per policy. Report non-compliant stores to regulatory agency. Parent education night planned.', 'Nurse Campbell', '2026-03-22'],
      ['Internet Safety', 'Online', 'Reports of students being contacted by strangers on gaming platforms and social media. Two incidents of attempted grooming identified.', 'high', 'Digital citizenship curriculum enhanced. Parent workshop on online safety. Coordinate with cyber crimes unit. Age-appropriate discussions in all grades.', 'IT Director Walsh', '2026-04-09'],
    ];
    for (const c of communityRisks) {
      await client.query(
        `INSERT INTO community_risks (risk_type, area, description, risk_level, mitigation, reported_by, last_assessed) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        c
      );
    }

    console.log('All seed data inserted successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
