from flask import Flask, request, redirect, url_for, session, flash, render_template_string
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
import time

app = Flask(__name__)
app.secret_key = 'your_secret_key'
DB_NAME = 'careerpath.db'
MAX_ATTEMPTS = 3
LOCKOUT_TIME = 300  # 5 minutes in seconds
serializer = URLSafeTimedSerializer(app.secret_key)

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute('''careerpath
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_verified INTEGER DEFAULT 0,
                failed_attempts INTEGER DEFAULT 0,
                locked_until INTEGER DEFAULT 0
            )
        ''')

def render_html_file(filename):
    with open(filename) as f:
        return render_template_string(f.read())

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash('Passwords do not match!')
            return redirect(url_for('signup'))

        hashed_password = generate_password_hash(password)

        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
            if cursor.fetchone():
                flash('Username or Email already exists!')
                return redirect(url_for('signup'))

            cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                           (username, email, hashed_password))
            conn.commit()

        token = serializer.dumps(email, salt='email-confirm')
        verification_link = url_for('verify_email', token=token, _external=True)
        print(f'🔗 Email verification link (simulated): {verification_link}')
        flash('Signup successful! Please check your email to verify your account.')
        return redirect(url_for('login'))

    return render_html_file('signup.html')

@app.route('/verify/<token>')
def verify_email(token):
    try:
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except Exception:
        flash('Invalid or expired verification link.')
        return redirect(url_for('login'))

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_verified = 1 WHERE email = ?", (email,))
        conn.commit()

    flash('Email verified successfully! You can now log in.')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        now = int(time.time())

        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()

            if not user:
                flash('Invalid credentials.')
                return redirect(url_for('login'))

            user_id, uname, email, pwd_hash, verified, attempts, locked_until = user

            if verified == 0:
                flash('Please verify your email before logging in.')
                return redirect(url_for('login'))

            if locked_until and now < locked_until:
                wait_time = locked_until - now
                flash(f'Account locked. Try again in {wait_time} seconds.')
                return redirect(url_for('login'))

            if check_password_hash(pwd_hash, password):
                cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?", (user_id,))
                conn.commit()
                session['user_id'] = user_id
                session['username'] = uname
                flash('Login successful!')
                return redirect(url_for('dashboard'))
            else:
                attempts += 1
                if attempts >= MAX_ATTEMPTS:
                    cursor.execute("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?",
                                   (attempts, now + LOCKOUT_TIME, user_id))
                    flash('Account locked due to too many failed attempts.')
                else:
                    cursor.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", (attempts, user_id))
                    flash(f'Invalid password. {MAX_ATTEMPTS - attempts} attempt(s) left.')
                conn.commit()
                return redirect(url_for('login'))

    return render_html_file('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' in session:
        return f"Welcome {session['username']}!<br><a href='/logout'>Logout</a>"
    else:
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out!')
    return redirect(url_for('login'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
