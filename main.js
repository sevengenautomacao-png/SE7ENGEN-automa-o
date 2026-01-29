import { supabase } from './supabase.js'

// --- UI Elements ---
const navbar = document.getElementById('navbar');
const openAuthBtn = document.getElementById('openAuth');
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.querySelector('.close-modal');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.getElementById('contactForm');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const googleLoginBtn = document.getElementById('googleLogin');
const passwordToggles = document.querySelectorAll('.password-toggle');

let currentUser = null;

// --- Navbar scroll effect ---
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- Smooth scrolling ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId || targetId.startsWith('http')) return;

        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// --- Auth Modal Logic ---
const toggleModal = (show) => {
    if (show) authModal.classList.add('active');
    else authModal.classList.remove('active');
};

if (openAuthBtn) openAuthBtn.addEventListener('click', () => {
    if (currentUser) window.location.href = 'dashboard.html';
    else toggleModal(true);
});

if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => toggleModal(false));
window.addEventListener('click', (e) => { if (e.target === authModal) toggleModal(false); });

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        authTabs.forEach(t => t.classList.remove('active'));
        authForms.forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${targetTab}Form`).classList.add('active');
    });
});

// --- Authentication & UI Updates ---
const updateAuthUI = async (user) => {
    currentUser = user;
    if (!openAuthBtn) return;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const name = profile?.full_name || user.user_metadata?.full_name || user.email;
        openAuthBtn.innerText = `Olá, ${name.split(' ')[0]}`;

        // Add a dashboard link if not already there
        if (!document.getElementById('navDashboard')) {
            const li = document.createElement('li');
            li.id = 'navDashboard';
            li.innerHTML = `<a href="dashboard.html" style="color: var(--primary);">Meu Painel</a>`;
            document.querySelector('.nav-links').appendChild(li);
        }
    } else {
        openAuthBtn.innerText = 'Login / Cadastro';
        const dashLink = document.getElementById('navDashboard');
        if (dashLink) dashLink.remove();
    }
};

// --- Check Initial Session ---
const updateCartUI = async () => {
    if (!currentUser) {
        document.querySelectorAll('.cart-badge').forEach(b => b.innerText = '0');
        return;
    }

    const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

    if (!error) {
        document.querySelectorAll('.cart-badge').forEach(b => b.innerText = count || 0);
    }
};

const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    updateAuthUI(currentUser);
    updateCartUI();

    supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);
        updateCartUI();
    });
};

// --- Form Submissions ---

// Google Login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert('Erro ao entrar com Google: ' + error.message);
    });
}

// Signup
if (signupForm) {
    const signupPass = document.getElementById('signupPass');
    const signupConfirmPass = document.getElementById('signupConfirmPass');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    const updateStrength = (password) => {
        let strength = 0;
        if (password.length > 5) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/) && password.match(/[^a-zA-Z0-9]/)) strength++;

        strengthBar.className = 'strength-bar';
        if (password.length === 0) {
            strengthText.innerText = 'Força da senha';
        } else if (strength === 1) {
            strengthBar.classList.add('strength-weak');
            strengthText.innerText = 'Senha Fraca';
        } else if (strength === 2) {
            strengthBar.classList.add('strength-medium');
            strengthText.innerText = 'Senha Média';
        } else if (strength === 3) {
            strengthBar.classList.add('strength-strong');
            strengthText.innerText = 'Senha Forte';
        }
    };

    signupPass.addEventListener('input', (e) => updateStrength(e.target.value));

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = signupPass.value;
        const confirmPassword = signupConfirmPass.value;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) alert('Erro no Cadastro: ' + error.message);
        else {
            alert(`Verifique seu e-mail para confirmar o cadastro, ${name}!`);
            toggleModal(false);
        }
    });
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert('Erro no Login: ' + error.message);
        else toggleModal(false);
    });
}

// Quote Request
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const service = document.getElementById('service').value;
        const details = document.getElementById('message').value;

        const { error } = await supabase.from('quotes').insert([{
            user_id: currentUser?.id || null,
            client_name: name,
            client_email: email,
            service,
            details,
            status: 'Pendente'
        }]);

        if (error) alert('Erro ao enviar: ' + error.message);
        else {
            alert('Orçamento solicitado com sucesso!');
            contactForm.reset();
        }
    });
}

// Add to Cart
const addToCart = async (productName, variationId = null, quantity = 1) => {
    if (!currentUser) {
        alert('Por favor, faça login para adicionar itens ao carrinho.');
        toggleModal(true);
        return;
    }

    // Get product ID first
    const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('name', productName)
        .single();

    if (product) {
        const cartItem = {
            user_id: currentUser.id,
            product_id: product.id,
            variation_id: variationId,
            quantity: quantity
        };

        const { error } = await supabase.from('cart').insert([cartItem]);

        if (error) alert('Erro ao adicionar ao carrinho: ' + error.message);
        else {
            alert(`${quantity}x ${productName} adicionado ao seu carrinho!`);
            updateCartUI();
        }
    }
};

// Expose globally for other pages
window.addToCart = addToCart;
window.updateCartUI = updateCartUI;

// Update buy buttons
document.querySelectorAll('.product-card .btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const productName = button.parentElement.querySelector('h3').innerText;
        addToCart(productName);
    });
});

// Password visibility toggle
passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            toggle.classList.add('visible');
        } else {
            input.type = 'password';
            toggle.classList.remove('visible');
        }
    });
});

// Initializing
initAuth();
console.log("SE7ENGEN Enhanced UI Logic Initialized");
