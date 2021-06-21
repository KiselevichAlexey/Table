import workers from "./mockWorkers.js";

const DATE_PATTERN = /(\d{2})\.(\d{2})\.(\d{4})/;
const FULL_NAME_PATTERN = /[А-Я][а-я]+?\s[А-Я][а-я]+?\s[А-Я][а-я]+/;
const tBody = document.querySelector("tbody");
const sortBtn = document.querySelectorAll("th img");
//
/////////////////////// Имитация полученя данных
//
const fetchWorkers = async (sessionData) => {
  return new Promise((resolve) => {
    resolve(sessionData || workers.workers);
  }).then((res) => res.map((worker) => createRow(worker)));
};
//
/////////////////////// Создание строк таблицы
//
function createRow(item) {
  const row = document.createElement("tr");
  row.setAttribute("draggable", true);
  row.addEventListener("dragstart", () => row.classList.add("dragging"));
  row.addEventListener("dragend", () => {
    row.classList.remove("dragging");
    save();
  });
  const {number, fullName, salary, dateOfBirth } = item;
  row.innerHTML = `
	<td class="serial-number">
	${number || tBody.childElementCount + 1}
	</td>
	<td class="worker" contenteditable>
	${fullName}
	</td>
	<td class="date-of-birth" contenteditable>
	${new Date(dateOfBirth).toLocaleDateString("ru")}
	</td>
	<td class="salary" contenteditable>
	${salary}
	</td>
	<td class="delete" >
	<img src="delete.png"/>
	</td>`;
  [...row.cells].forEach((cell) => {
    cell.addEventListener("focus", editCell);
    cell.addEventListener("blur", blur);
  });
  row.querySelector(".delete img").addEventListener("click", deleteRow);
  tBody.appendChild(row);
  getTotalSalary();
  totalWorkers();
  totalBirthday();
  save();
}
//
/////////////////////// Проверка ввода при изменении  яцеек таблицы
//
function editCell(e) {
  //сохраняе начальное значение
  cellValue = e.target.innerText;
}
let cellValue = null;

function blur(event) {
  switch (event.target.classList[0]) {
    case "worker":
      if (!FULL_NAME_PATTERN.test(event.target.innerHTML)) {
        alert(
          'Неверные данные .Введите данные в формате:\n"Калинин Владимир Александрович"'
        );
        event.target.innerHTML = cellValue;
      }
      break;
    case "salary":
      if (
        !Number(event.target.innerText) ||
        Number(event.target.innerText) < 0
      ) {
        alert("Неверные данные .\nВведите число больше 0");
        event.target.innerHTML = cellValue;
      }
      getTotalSalary();
      break;
    case "date-of-birth":
      if (!DATE_PATTERN.test(event.target.innerHTML)) {
        alert('Неверная дата .\nВведите дату в формате:"ДД.MM.ГГГГ"');
        event.target.innerHTML = cellValue;
      }
      break;
  }
  save();
}
//
/////////////////////// Drag and Drop
//
tBody.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = dragAfterElement(tBody, e.clientY);
  const draggable = document.querySelector(".dragging");
  if (afterElement == null) {
    tBody.appendChild(draggable);
  } else {
    tBody.insertBefore(draggable, afterElement);
  }
  currentSerialNumber();
});
function dragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll('[draggable="true"]:not(.dragging)'),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
// установка порядкового номера
function currentSerialNumber() {
  [...tBody.querySelectorAll(".serial-number")].forEach((value, index) => {
    value.textContent = index + 1;
  });
}
//
/////////////////////// Удаление строк таблицы
//
function deleteRow(event) {
  tBody.removeChild(event.currentTarget.parentElement.parentElement);
  getTotalSalary();
  totalWorkers();
  totalBirthday();
  currentSerialNumber();
  save();
}
//
/////////////////////// Обработка формы добавления новых работников
//
const form = document.forms[0];
form.addEventListener("submit", handleSubmit);

function handleSubmit(event) {
  event.preventDefault();
  createRow({
    fullName: form["full-name"].value,
    salary: form["salary"].value,
    dateOfBirth: form["date-of-birth"].value,
  });
  form["full-name"].value = "";
  form["salary"].value = "";
  form["date-of-birth"].value = "";
}
// Добавление обработчика для кнопок сортировки
[...sortBtn].forEach((btn) => btn.addEventListener("click", sortRow));
//
/////////////////////// Сортировка по строкаь
//
function sortRow(event) {
  const thead = document.querySelector("thead tr");
  const sortedRows = [...tBody.children];
  let target = null;
  // Изменяем класс иконке сортировки
  event.currentTarget.classList.toggle("sort");
  // Удаляем класс для остальных иконок
  [...sortBtn].forEach((btn) => {
    if (btn !== event.currentTarget) btn.classList.remove("sort");
  });
  // Определяем на каком столбце произошло событие
  [...thead.children].forEach((value, index) => {
    if (value == event.currentTarget.parentElement.parentElement) {
      target = index;
    }
  });
  // Сортировка по значению столбца
  switch (target) {
    case 0:
    case 3:
      sortedRows.sort((rowA, rowB) => {
        return rowB.cells[target].innerText - rowA.cells[target].innerText;
      });
      break;
    case 1:
      sortedRows.sort((rowA, rowB) => {
        return rowA.cells[target].innerText > rowB.cells[target].innerText
          ? 1
          : -1;
      });
      break;
    case 2:
      sortedRows.sort((rowA, rowB) => {
        return (
          Date.parse(
            rowA.cells[target].innerText.replace(DATE_PATTERN, "$3-$2-$1")
          ) -
          Date.parse(
            rowB.cells[target].innerText.replace(DATE_PATTERN, "$3-$2-$1")
          )
        );
      });
      break;
  }
  // Если произошло повторное событие на томже столбце перевернуть массив
  if (!event.currentTarget.classList.contains("sort")) sortedRows.reverse();
  // Добавления отсортированых данных в таблицу
  tBody.append(...sortedRows);
  if (target != 0) currentSerialNumber();
  save();
}

//
/////////////////////// итоговая сумма оклада
//
function getTotalSalary() {
  let totalSalary = 0;
  [...tBody.children].forEach((value) => {
    totalSalary += +value.querySelector(".salary").textContent;
  });
  document.querySelector(".total-salary").innerText = totalSalary;
}

const getTotalColunm = (destinationSelctor, columnSelector) => {
  return () => {
    let total = 0;
    [...tBody.children].forEach((value) => {
      if (value.querySelector(columnSelector).innerText) total += 1;
    });
    document.querySelector(destinationSelctor).textContent = total;
  };
};
// количество значений в столбце ФИО
const totalWorkers = getTotalColunm(".total-workers", ".worker");
// количество значений в столбце Дата рождения
const totalBirthday = getTotalColunm(".total-birthday", ".date-of-birth");
//
////////////// сохранение данных в localStorage
//
function save() {
  const data = [];
  [...tBody.children].forEach((el) => {
    data.push(new Worker(
		Number(el.querySelector('.serial-number').innerText),
		el.querySelector('.worker').innerText,
		Number(el.querySelector('.salary').innerText),
		new Date(el.querySelector('.date-of-birth').innerText.replace(DATE_PATTERN, "$3-$2-$1"))),
	)
  });
  localStorage.setItem("data",JSON.stringify(data));
}

class Worker {
	constructor(number, fullName, salary, dateOfBirth) {
		this.number = number,
		this.fullName = fullName,
		this.salary = salary,
		this.dateOfBirth = dateOfBirth;
	}
}
document.addEventListener("load", fetchWorkers(JSON.parse(localStorage.getItem("data"))));
