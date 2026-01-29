import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderId, items, customerEmail, subtotal, shippingCost } = await req.json()

        // Map items to Mercado Pago format
        const mpItems = items.map((item: any) => ({
            id: item.id,
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'BRL'
        }))

        // Add shipping as an item or use shipiment field (items is easier for simple calc)
        if (shippingCost > 0) {
            mpItems.push({
                id: 'shipping',
                title: 'Frete',
                unit_price: Number(shippingCost),
                quantity: 1,
                currency_id: 'BRL'
            })
        }

        const body = {
            items: mpItems,
            payer: {
                email: customerEmail,
            },
            external_reference: orderId,
            back_urls: {
                success: `${req.headers.get('origin')}/dashboard.html?status=success&order=${orderId}`,
                failure: `${req.headers.get('origin')}/dashboard.html?status=failure&order=${orderId}`,
                pending: `${req.headers.get('origin')}/dashboard.html?status=pending&order=${orderId}`,
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_types: [],
                installments: 12
            },
            statement_descriptor: "SE7ENGEN",
        }

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const preference = await response.json()

        if (!response.ok) {
            console.error("Mercado Pago Error:", preference)
            throw new Error(preference.message || "Erro ao criar preferência no Mercado Pago")
        }

        return new Response(
            JSON.stringify({ id: preference.id, init_point: preference.init_point }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
