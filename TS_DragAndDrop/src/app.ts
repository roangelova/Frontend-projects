//autobind decorator
//function autobind(target: any, methodName: string, descriptor: PropertyDescriptor) {
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    //the _ is a hint that we only accept the args because we have to, but don't actually need them. An alternative
    //would be to change the strictness of the project
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjustedDescriptor;
}

//ROJECT STATE MANAGEMENT
class ProjectState{
    private projects : any[]= [];

    addProject(title:string, description:string, numOfPeople:number){
        const newProject = {
            id: Math.random().toString(),
            title: title,
            description: description,
            people: numOfPeople
        };
        this.projects.push(newProject);
    }
}

//VALIDATION
interface Validatable {
    value: string | number,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number
}

function validate(object: Validatable) {
    let isValid = true;

    if (object.required) {
        isValid = isValid && object.value.toString().trim().length !== 0;
    }
    if (object.minLength != null && typeof object.value === 'string') {
        //this would only apply to strings
        isValid = isValid && object.value.length > object.minLength;
    }
    if (object.maxLength != null && typeof object.value === 'string') {
        isValid = isValid && object.value.length < object.maxLength;
    }
    if (object.min != null && typeof object.value === 'number') {
        isValid = isValid && object.value > object.min;
    }
    if (object.max != null && typeof object.value === 'number') {
        isValid = isValid && object.value < object.max;
    }

    return isValid;
}

//ProjectList Class
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement; //there isnt an HTMLSectionType

    constructor(private type: 'active' | 'finished') { //accessor will auto add a property of the same name and stores the value
        this.templateElement = <HTMLTemplateElement>document.getElementById('project-list')!;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id =  `${this.type}-projects`; //it will be dynamics based on isActive or not project
        this.attach();
        this.renderContent();
    }

    private renderContent(){
        //TODO -> .169 
        const listId = `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private attach(){
                this.hostElement.insertAdjacentElement('beforeend', this.element)
    }
}


//ProjectInput class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!; // or as HTMLTemplateElement
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
        this.attach();
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }

    private configure() {
       this.element.addEventListener('submit', this.submitHandler.bind(this))
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput(); //there is no way for us to check if the return type is a tuple at runtime 

        if (Array.isArray(userInput))//HOW WE CAN CHECK FOR A TUPLE
        {
            const [title, desc, people] = userInput;
            console.log(title, people, desc)
            this.clearInputs();
        }
    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true,
            minLength: 5,
            maxLength: 15
        }
        //... add for all types 

        if (!validate(titleValidatable)) {
            alert('Invalid user input!');
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }
    }
}

const prjInput = new ProjectInput();
const activePrjLiist = new ProjectList('active');
const finishedPrjLiist = new ProjectList('finished');
