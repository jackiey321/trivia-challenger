const request = require("supertest");
const route = require("./routes/index");
const app = require("./app");

describe("Home Page", () => {
  test("home page works", async () => {
      await request(app).get("/").expect(200);
  });
});

describe("Selection Page", () => {
  test("selection page works", async () => {
      let data = { name: "Jackie" }
      await request(app).post("/selection").send(data).expect(200);
  });
});

describe("categoryIndex Function", () => {
  test("categoryIndex defined", () => {
    expect(route.categoryIndex).toBeDefined();
  });
  test("categoryIndex works", () => {
    expect(route.categoryIndex("general")).toEqual(9);
    expect(route.categoryIndex("art")).toEqual(25);
    expect(route.categoryIndex("celebrities")).toEqual(26);
    expect(route.categoryIndex("film")).toEqual(11);
    expect(route.categoryIndex("music")).toEqual(12);
    expect(route.categoryIndex("science")).toEqual(17);
    expect(route.categoryIndex("sports")).toEqual(21);
  });
});

describe("getQuestion Function", () => {
  test("getQuestion defined", () => {
    expect(route.getQuestion).toBeDefined();
  });
  test("getQuestion works 1", async () => {
    const obj = await route.getQuestion(9, "easy");
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("question"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("correct_answer"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("incorrect_answers"));
  });
  test("getQuestion works 2", async () => {
    const obj = await route.getQuestion(26, "medium");
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("question"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("correct_answer"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("incorrect_answers"));
  });
  test("getQuestion works 3", async () => {
    const obj = await route.getQuestion(17, "hard");
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("question"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("correct_answer"));
    expect(JSON.stringify(obj)).toEqual(expect.stringContaining("incorrect_answers"));
  });
});

describe("decode Function", () => {
  test("decode defined", () => {
    expect(route.decode).toBeDefined();
  });
  test("decode works", () => {
    expect(route.decode("I&apos;m")).toEqual("I'm");
    expect(route.decode("Ben &amp; Jerry&apos;s")).toEqual("Ben & Jerry's");
  });
});

describe("makeChoices Function", () => {
  test("makeChoices defined", () => {
    expect(route.makeChoices).toBeDefined();
  });
  test("makeChoices works", () => {
    expect(route.makeChoices("correct", ["a", "b", "c"]).length).toEqual(4);
    expect(route.makeChoices("correct", ["a", "b", "c"])).toContain("correct");
    expect(route.makeChoices("correct", ["a", "b", "c"])).toContain("a");
    expect(route.makeChoices("correct", ["a", "b", "c"])).toContain("b");
    expect(route.makeChoices("correct", ["a", "b", "c"])).toContain("c");
  });
});

describe("Question Page", () => {
  test("question page works", async () => {
      let data = {
        category: "general",
        difficulty: "easy"
      };
      await request(app).post("/question").send(data).expect(200);
  });
});

describe("getPoints Function", () => {
  test("getPoints defined", () => {
    expect(route.getPoints).toBeDefined();
  });
  test("getPoints works", () => {
    expect(route.getPoints("easy")).toEqual(10);
    expect(route.getPoints("medium")).toEqual(30);
    expect(route.getPoints("hard")).toEqual(50);
  });
});

describe("Check Page", () => {
  test("check page works", async () => {
      let data = {
        choice: "answer"
      };
      await request(app).post("/check").send(data).expect(200);
  });
  test("check page works (more thorough)", async () => {
    let qData = {
      category: "general",
      difficulty: "easy"
    };
    await request(app).post("/question").send(qData).expect(200);
    let aData = {
      choice: "answer"
    };
    await request(app).post("/check").send(aData).expect(200);
});
});

describe("Rankings Page", () => {
  test("rankings page works", async () => {
      await request(app).get("/rankings").expect(200);
  });
});