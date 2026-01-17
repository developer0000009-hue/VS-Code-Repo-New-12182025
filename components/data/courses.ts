import { Course } from '../../types';

export const courses: Course[] = [
    // ========== CBSE Courses ==========
    // --- Primary (1-5) ---
    { id: 1, title: 'English', grade_level: '1', code: 'CBSE-01-ENG', description: 'Focuses on foundational literacy skills based on NCERT Marigold.', credits: 3, category: 'Core', status: 'Active' },
    { id: 2, title: 'Hindi', grade_level: '1', code: 'CBSE-01-HIN', description: 'Introduces basic Hindi language skills using NCERT Rimjhim.', credits: 3, category: 'Core', status: 'Active' },
    { id: 3, title: 'Mathematics', grade_level: '1', code: 'CBSE-01-MAT', description: 'Covers counting, shapes, and basic arithmetic as per NCERT Math-Magic.', credits: 3, category: 'Core', status: 'Active' },
    { id: 4, title: 'Environmental Studies (EVS)', grade_level: '3', code: 'CBSE-03-EVS', description: 'Integrates science and social studies concepts from the immediate environment.', credits: 3, category: 'Core', status: 'Active' },
    { id: 5, title: 'English', grade_level: '5', code: 'CBSE-05-ENG', description: 'Builds reading comprehension, grammar, and writing skills.', credits: 3, category: 'Core', status: 'Active' },
    { id: 6, title: 'Mathematics', grade_level: '5', code: 'CBSE-05-MAT', description: 'Advanced arithmetic, geometry, and data handling.', credits: 3, category: 'Core', status: 'Active' },

    // --- Middle (6-8) ---
    { id: 7, title: 'Science', grade_level: '6', code: 'CBSE-06-SCI', description: 'Introduces concepts of Physics, Chemistry, and Biology from NCERT textbooks.', credits: 3, category: 'Core', status: 'Active' },
    { id: 8, title: 'Social Science', grade_level: '7', code: 'CBSE-07-SST', description: 'Covers History, Civics, and Geography based on the NCERT syllabus.', credits: 3, category: 'Core', status: 'Active' },
    { id: 9, title: 'Sanskrit', grade_level: '8', code: 'CBSE-08-SAN', description: 'Third language course focusing on grammar and literature.', credits: 3, category: 'Core', status: 'Active' },

    // --- Secondary (9-10) ---
    { id: 10, title: 'Science', grade_level: '9', code: 'CBSE-09-SCI', description: 'Detailed study of Physics, Chemistry, and Biology preparing for board exams.', credits: 4, category: 'Core', status: 'Active' },
    { id: 11, title: 'Social Science', grade_level: '10', code: 'CBSE-10-SST', description: 'In-depth study of India and the contemporary world, economics, and politics.', credits: 4, category: 'Core', status: 'Active' },
    { id: 12, title: 'Information Technology', grade_level: '10', code: 'CBSE-10-IT', description: 'Vocational subject covering digital literacy and basic programming.', credits: 3, category: 'Vocational', status: 'Active' },

    // --- Senior Secondary (11-12) - Science ---
    { id: 13, title: 'Physics', grade_level: '11', code: 'CBSE-11-PHY', description: 'Covers mechanics, thermodynamics, and waves.', credits: 4, category: 'Science', status: 'Active' },
    { id: 14, title: 'Chemistry', grade_level: '11', code: 'CBSE-11-CHE', description: 'Focuses on atomic structure, chemical bonding, and organic chemistry basics.', credits: 4, category: 'Science', status: 'Active' },
    { id: 15, title: 'Biology', grade_level: '11', code: 'CBSE-11-BIO', description: 'Studies diversity in living world, cell structure, and plant/animal physiology.', credits: 4, category: 'Science', status: 'Active' },
    { id: 16, title: 'Mathematics', grade_level: '11', code: 'CBSE-11-MAT', description: 'Advanced algebra, trigonometry, and calculus concepts.', credits: 4, category: 'Science', status: 'Active' },
    { id: 17, title: 'Physics', grade_level: '12', code: 'CBSE-12-PHY', description: 'Covers electricity, magnetism, optics, and modern physics.', credits: 4, category: 'Science', status: 'Active' },
    { id: 18, title: 'Computer Science', grade_level: '12', code: 'CBSE-12-CS', description: 'Focuses on programming in Python and database management.', credits: 4, category: 'Science', status: 'Active' },
    
    // --- Senior Secondary (11-12) - Commerce ---
    { id: 19, title: 'Accountancy', grade_level: '11', code: 'CBSE-11-ACC', description: 'Introduces fundamental accounting principles and processes.', credits: 4, category: 'Commerce', status: 'Active' },
    { id: 20, title: 'Business Studies', grade_level: '11', code: 'CBSE-11-BST', description: 'Covers the nature of business, forms of organizations, and trade.', credits: 4, category: 'Commerce', status: 'Active' },
    { id: 21, title: 'Economics', grade_level: '12', code: 'CBSE-12-ECO', description: 'Covers Macroeconomics, including national income and money and banking.', credits: 4, category: 'Commerce', status: 'Active' },
    
    // --- Senior Secondary (11-12) - Arts ---
    { id: 22, title: 'History', grade_level: '11', code: 'CBSE-11-HIS', description: 'Themes in world history, from early societies to modernization.', credits: 4, category: 'Arts', status: 'Active' },
    { id: 23, title: 'Political Science', grade_level: '12', code: 'CBSE-12-POL', description: 'Covers contemporary world politics and politics in India since independence.', credits: 4, category: 'Arts', status: 'Active' },
    { id: 24, title: 'Psychology', grade_level: '12', code: 'CBSE-12-PSY', description: 'Studies variations in psychological attributes, self, and personality.', credits: 4, category: 'Arts', status: 'Active' },

    // --- Common Subjects (11-12) ---
    { id: 25, title: 'English Core', grade_level: '11', code: 'CBSE-11-ENG', description: 'Advanced language and literature skills.', credits: 3, category: 'Common', status: 'Active' },
    { id: 26, title: 'English Core', grade_level: '12', code: 'CBSE-12-ENG', description: 'Focus on comprehension, writing skills, and literary analysis.', credits: 3, category: 'Common', status: 'Active' },

    // ========== RBSE Courses ==========
    // --- Primary (1-5) ---
    { id: 27, title: 'Hindi', grade_level: '1', code: 'RBSE-01-HIN', description: 'Basic Hindi literacy based on the Rajasthan state curriculum.', credits: 3, category: 'Core', status: 'Active' },
    { id: 28, title: 'English', grade_level: '2', code: 'RBSE-02-ENG', description: 'Introduction to English alphabet and simple words.', credits: 3, category: 'Core', status: 'Active' },
    { id: 29, title: 'Mathematics', grade_level: '4', code: 'RBSE-04-MAT', description: 'Arithmetic and geometry with regional context.', credits: 3, category: 'Core', status: 'Active' },
    { id: 30, title: 'Environmental Studies', grade_level: '5', code: 'RBSE-05-EVS', description: 'Focuses on Rajasthan\'s environment and culture.', credits: 3, category: 'Core', status: 'Active' },
    
    // --- Middle (6-8) ---
    { id: 31, title: 'Science', grade_level: '6', code: 'RBSE-06-SCI', description: 'General science topics as prescribed by the RBSE.', credits: 3, category: 'Core', status: 'Active' },
    { id: 32, title: 'Social Science', grade_level: '7', code: 'RBSE-07-SST', description: 'Emphasis on the history and geography of Rajasthan.', credits: 3, category: 'Core', status: 'Active' },
    { id: 33, title: 'Sanskrit', grade_level: '8', code: 'RBSE-08-SAN', description: 'Third language studies with a focus on traditional texts.', credits: 3, category: 'Core', status: 'Active' },

    // --- Secondary (9-10) ---
    { id: 34, title: 'Information Technology', grade_level: '9', code: 'RBSE-09-IT', description: 'Foundations of computer systems and applications.', credits: 3, category: 'Vocational', status: 'Active' },
    { id: 35, title: 'Mathematics', grade_level: '10', code: 'RBSE-10-MAT', description: 'Preparation for the RBSE secondary board examination in Mathematics.', credits: 4, category: 'Core', status: 'Active' },
    
    // --- Senior Secondary (11-12) - Science ---
    { id: 36, title: 'Physics', grade_level: '11', code: 'RBSE-11-PHY', description: 'State board curriculum for Physics, covering core concepts.', credits: 4, category: 'Science', status: 'Active' },
    { id: 37, title: 'Chemistry', grade_level: '12', code: 'RBSE-12-CHE', description: 'Focuses on topics relevant for state-level competitive exams.', credits: 4, category: 'Science', status: 'Active' },

    // --- Senior Secondary (11-12) - Commerce ---
    { id: 38, title: 'Accountancy', grade_level: '11', code: 'RBSE-11-ACC', description: 'Fundamentals of bookkeeping and accountancy as per RBSE.', credits: 4, category: 'Commerce', status: 'Active' },
    { id: 39, title: 'Business Studies', grade_level: '12', code: 'RBSE-12-BST', description: 'Covers principles of management and business finance.', credits: 4, category: 'Commerce', status: 'Active' },

    // --- Senior Secondary (11-12) - Arts ---
    { id: 40, title: 'History', grade_level: '11', code: 'RBSE-11-HIS', description: 'Focus on Indian and Rajasthan history.', credits: 4, category: 'Arts', status: 'Active' },
    { id: 41, title: 'Political Science', grade_level: '12', code: 'RBSE-12-POL', description: 'Study of political theories and the Indian constitution.', credits: 4, category: 'Arts', status: 'Active' },

    // --- Common Subjects (11-12) ---
    { id: 42, title: 'English (Compulsory)', grade_level: '11', code: 'RBSE-11-ENG', description: 'Compulsory English course for all streams.', credits: 3, category: 'Common', status: 'Active' },
    { id: 43, title: 'Hindi (Compulsory)', grade_level: '12', code: 'RBSE-12-HIN', description: 'Compulsory Hindi course for all streams.', credits: 3, category: 'Common', status: 'Active' },
];
