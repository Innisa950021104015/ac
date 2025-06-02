import pandas as pd
import json
import os

# Define paths to O*NET 29.2 Database files (update with your local paths)
data_dir = 'path/to/O*NET_29_2_Database'
occ_file = os.path.join(data_dir, 'Occupation Data.txt')
tasks_file = os.path.join(data_dir, 'Tasks.txt')
tech_skills_file = os.path.join(data_dir, 'Technology Skills.txt')
edu_file = os.path.join(data_dir, 'Education, Training, and Experience.txt')

# Load files
occupations = pd.read_csv(occ_file, sep='\t', encoding='utf-8')
tasks = pd.read_csv(tasks_file, sep='\t', encoding='utf-8')
tech_skills = pd.read_csv(tech_skills_file, sep='\t', encoding='utf-8')
education = pd.read_csv(edu_file, sep='\t', encoding='utf-8')

# Initialize JSON structure
data = {}

# Custom resources for the original 23 careers
custom_resources = {
    '15-1252.00': [{ 'name': 'TN Private Jobs Portal', 'link': 'https://tnprivatejobs.tn.gov.in/' }],
    '15-2051.00': [{ 'name': 'StrataScratch - Career Path', 'link': 'https://www.stratascratch.com/blog/a-complete-guide-to-data-scientist-career-path/' }],
    '11-3012.00': [{ 'name': 'TNPSC Official Site', 'link': 'https://www.tnpsc.gov.in/' }],
    '11-1011.00': [{ 'name': 'UPSC Official Website', 'link': 'https://upsc.gov.in/' }],
    '11-3031.00': [{ 'name': 'IBPS Official Portal', 'link': 'https://www.ibps.in/' }],
    '55-1011.00': [{ 'name': 'Join Indian Army', 'link': 'https://joinindianarmy.nic.in/' }],
    '27-3023.00': [{ 'name': 'Asian College of Journalism', 'link': 'https://www.asianmedia.org.in/' }],
    '19-1013.00': [{ 'name': 'TNAU Careers', 'link': 'https://tnau.ac.in/site/csw/job-opportunities/' }],
    '25-2021.00': [{ 'name': 'TN TRB', 'link': 'https://trb.tn.nic.in/' }],
    '17-2051.00': [{ 'name': 'TNPSC', 'link': 'https://www.tnpsc.gov.in/' }],
    '29-1141.00': [{ 'name': 'TN MRB', 'link': 'https://www.mrb.tn.gov.in/' }],
    '33-3051.00': [{ 'name': 'TNUSRB', 'link': 'https://www.tnusrb.tn.gov.in/' }],
    '29-1215.00': [{ 'name': 'NEET', 'link': 'https://nta.ac 🙂in/medicalexam' }],
    '17-2141.00': [{ 'name': 'TN Private Jobs', 'link': 'https://tnprivatejobs.tn.gov.in/' }],
    '27-1022.00': [{ 'name': 'NIFT Chennai', 'link': 'https://www.nift.ac.in/chennai/' }],
    '17-2000.00': [{ 'name': 'Anna University TNEA', 'link': 'https://www.tneaonline.org/' }],
    '27-1024.00': [{ 'name': 'NIFT Chennai', 'link': 'https://www.nift.ac.in/chennai/' }],
    '27-1014.00': [{ 'name': 'Arena Animation', 'link': 'https://www.arena-multimedia.com/in/' }],
    '27-1000.00': [{ 'name': 'UCEED', 'link': 'https://www.uceed.iitb.ac.in/' }],
    '21-1021.00': [{ 'name': 'TISS Mumbai', 'link': 'https://www.tiss.edu/' }],
    '27-1013.00': [{ 'name': 'Govt. College of Fine Arts, Chennai', 'link': 'https://www.gcfa.tn.gov.in/' }],
    '11-3121.00': [{ 'name': 'TANCET MBA Info', 'link': 'https://www.annauniv.edu/' }],
    '43-9061.00': [{ 'name': 'TNPSC Group 4', 'link': 'https://www.tnpsc.gov.in/' }]
}

# Process each occupation
for _, row in occupations.iterrows():
    code = row['O*NET-SOC Code']
    key = code.replace('.', '_')
    occ_tasks = tasks[tasks['O*NET-SOC Code'] == code]['Task'].tolist()[:2]  # Limit to 2 tasks
    occ_tech = tech_skills[tech_skills['O*NET-SOC Code'] == code]['Example'].tolist()[:4]  # Limit to 4 skills
    occ_edu = education[education['O*NET-SOC Code'] == code]['Category Description'].iloc[0] if not education[education['O*NET-SOC Code'] == code].empty else 'Not specified'

    # Base resources
    resources = [
        { 'name': f'O*NET: {row["Title"]}', 'link': f'https://www.onetonline.org/link/summary/{code}' }
    ]
    # Add custom resources for the original 23 careers
    if code in custom_resources:
        resources.extend(custom_resources[code])

    data[key] = {
        'onet_code': code,
        'title': row['Title'],
        'description': row['Description'],
        'education_required': occ_edu,
        'tasks': occ_tasks,
        'technology_skills': occ_tech,
        'resources': resources
    }

# Save to JSON
with open('onet_careers.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)