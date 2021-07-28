const add=require("../unitTest/add");

test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(5, 4)).toBe(9);
    expect(add(6, 6)).toBe(12);
    expect(add(3, "masum")).toBe("3masum");
});