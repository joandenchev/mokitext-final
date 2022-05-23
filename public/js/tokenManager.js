export async function checkRequest() {
    const tokenA = localStorage.getItem('tokenA')
    const result = await fetch('http://localhost:3000/check', {
        method: 'GET',
        headers: {
            'Authorization': tokenA
        }
    })
    return result.ok
}

export async function swapToken() {
    const tokenR = localStorage.getItem('tokenR')
    try {

        const result = await fetch('http://localhost:6305/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: tokenR})
        })

        const res = await result.json()
        localStorage.setItem('tokenA', res.accessToken)
    } catch (e) {
        console.log(e)
    }

}
