import enqr from "../src/index";

/*
QR code, EC level H, Content: http://www.google.com/
 */
const GOLDEN: string = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAABmJLR0QA/wD/AP+gvaeTAAACqklEQVR4nO3dwW7jMAxF0bro//+yuysQbQiCpKRe3LNO7DQPHA5lW3ne932/hPF9+gOol4HCGCiMgcIYKIyBwhgozE/0gud5dnyOP+tYvJ4/OzZH74/+vuh8p7+flRUKY6AwBgoT9tBV99JvtodVe1729dkevvv7WVmhMAYKY6Aw6R66yv4bX+0xUU+tzoXVuTc6XqR6PisUxkBhDBSm3EOnRT0tu/ab7WndPXWaFQpjoDAGCnN9D82q9sz/zgqFMVAYA4Up99DTc1l1rXR6ztz9/VihMAYKY6Aw6R56+1zXPYdme+zp78cKhTFQGAOFCXvo6TmzqvtZmOrxp1mhMAYKY6Aw6edDdz+fWT1etgdGn6d7zux+tsYKhTFQGAOFSc+hu68/nu7hu/dgqP69ViiMgcIYKMxT3S93d4+bfpZlVf17ps+3skJhDBTGQGHG7ymqznHT98l2/x8gOl/0fudQfTBQGAOFKV8PvW1foNXpHr2aXtu1QmEMFMZAYcb3WNi9Fhodr/v6bvf1XOdQfTBQGAOFOf5sS/c9Sqfvm41075m/skJhDBTGQGHK9xSFJ2jeo+D03Nfd87Pvj1ihMAYKY6AwYQ+t/jbZ9NplZPp6bjfnUH0wUBgDhRmfQ6um57buPRt2H39lhcIYKIyBwqTvy53Wva/Qavc9S9XXZ1mhMAYKY6Aw6ftyp9dao/NN7w2YddtvdFuhMAYKY6Aw5WdbTq+1Zl/f/Txr1vT1WCsUxkBhDBTm+t/gzl4/rO4FOD2XTq+NW6EwBgpjoDDX99Cs03vIZ3t89v0RKxTGQGEMFKbcQ3ff1ptdC+3ew766/+00KxTGQGEMFGZ8z/mq3XsaRKo9Njpe9nwrKxTGQGEMFOb650OVY4XCGCiMgcIYKIyBwhgojIHC/AJduoEK9ldDCgAAAABJRU5ErkJggg==`;

test("library", () => {
    expect(typeof enqr).toBe("function");

    const qr = enqr("http://www.google.com/", {
        errorCorrection: "M"
    });

    const canvas = qr.renderToCanvas({
        targetSize: qr.matrix.width * 4,
        quietZone: 8
    });

    const uri = canvas.toDataURL();
    expect(uri).toBe(GOLDEN);
});
