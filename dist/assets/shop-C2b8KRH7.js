import{s as c,g as v}from"./supabase-CODpAGvx.js";import"./main-nOw0zNqG.js";const l=document.getElementById("shopGrid"),u=document.getElementById("productSearch"),s=document.getElementById("categoryFilter");let p=[],m=[];async function f(){const{data:i}=await c.from("categories").select("*").order("name");m=i||[],s&&(s.innerHTML='<option value="all">Todas as Categorias</option>'+m.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")),await b()}async function b(){let{data:i,error:t}=await c.from("products").select("*, product_variations(*)").order("name");if(t){if(console.error("Erro ao carregar produtos:",t),t.message&&t.message.includes("JWT expired")){console.log("Sessão expirada. Tentando deslogar..."),await c.auth.signOut(),alert("Sua sessão expirou. A página será recarregada."),window.location.reload();return}l.innerHTML=`<p style="grid-column: 1/-1; text-align: center; color: red; padding: 3rem;">Erro ao carregar: ${t.message}</p>`;return}i||(i=[]),p=i,g(i);const r=()=>{const a=u.value.toLowerCase(),e=s.value,o=p.filter(d=>{const n=d.name.toLowerCase().includes(a)||d.description.toLowerCase().includes(a),y=e==="all"||d.category_id===e;return n&&y});g(o)};u.addEventListener("input",r),s.addEventListener("change",r)}function g(i){if(i.length===0){l.innerHTML='<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">Nenhum equipamento encontrado.</p>';return}l.innerHTML=i.map(t=>{const r=t.product_variations&&t.product_variations.length>0,a=r?t.product_variations[0]:{price:t.price},e=r?t.product_variations.every(o=>o.stock<=0):!0;return`
                <div class="product-card glass ${e?"out-of-stock":""}" id="prod-${t.id}">
                    <div class="product-image">
                        <img src="${v(t.image_url,t.id)}" alt="${t.name}">
                        ${e?'<div class="stock-badge">Esgotado</div>':""}
                    </div>
                    <div class="product-info">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.7rem; color: var(--primary); font-weight: 700; text-transform: uppercase;">${t.brand||"SE7ENGEN"}</span>
                        </div>
                        <h3>${t.name}</h3>
                        
                        ${r?`
                            <div class="form-group" style="margin: 10px 0;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Opções:</label>
                                <select class="var-select glass" data-product-id="${t.id}" style="width: 100%; padding: 5px; color: white; background: var(--bg-card);">
                                    ${t.product_variations.map(o=>`<option value="${o.id}" data-price="${o.price}" data-stock="${o.stock}">${o.name}</option>`).join("")}
                                </select>
                            </div>
                        `:""}

                        <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.85rem; height: 3em; overflow: hidden;">${t.description}</p>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 10px;">
                            <div class="product-price" id="price-${t.id}" style="margin-bottom: 0;">R$ ${(r?a.price:t.price).toFixed(2).replace(".",",")}</div>
                            <div class="quantity-selector" style="display: flex; align-items: center; background: rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 5px;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); margin-right: 5px;">Qtd:</label>
                                <input type="number" class="qty-input" data-product-id="${t.id}" value="1" min="1" max="99" style="width: 40px; background: transparent; border: none; color: white; text-align: center; font-size: 0.9rem;">
                            </div>
                        </div>
                        
                        <button class="btn ${e?"btn-outline":"btn-primary"} buy-btn" 
                                data-product-id="${t.id}"
                                ${e?"disabled":""} 
                                style="width: 100%;">
                            ${e?"Indisponível":"Adicionar ao Carrinho"}
                        </button>
                    </div>
                </div>
            `}).join(""),document.querySelectorAll(".var-select").forEach(t=>{t.onchange=r=>{const a=t.getAttribute("data-product-id"),e=t.options[t.selectedIndex],o=parseFloat(e.getAttribute("data-price")),d=parseInt(e.getAttribute("data-stock"));document.getElementById(`price-${a}`).innerText=`R$ ${o.toFixed(2).replace(".",",")}`;const n=document.querySelector(`#prod-${a} .buy-btn`);d<=0?(n.disabled=!0,n.innerText="Esgotado"):(n.disabled=!1,n.innerText="Adicionar ao Carrinho")}}),document.querySelectorAll(".buy-btn").forEach(t=>{t.onclick=()=>{const r=t.getAttribute("data-product-id"),a=document.querySelector(`.var-select[data-product-id="${r}"]`),e=a?a.value:null,o=document.querySelector(`#prod-${r} h3`).innerText,d=document.querySelector(`.qty-input[data-product-id="${r}"]`),n=parseInt(d.value)||1;window.addToCart?window.addToCart(o,e,n):alert("Por favor, faça login para comprar.")}})}f();
