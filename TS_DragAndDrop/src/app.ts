enum ProjectStatus {
    Active, Finished
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U; //there isnt an HTMLSectionType

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        this.templateElement = <HTMLTemplateElement>document.getElementById(templateId)!;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId; //it will be dynamics based on isActive or not project
        }

        this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

//PROJECT TYPE
class Project {

    constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {

    }
}

type Listener<T> = (items: T[]) => void;

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

abstract class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFN: Listener<T>) {
        this.listeners.push(listenerFN);
        //we will call our listeners whenever something changes
    }

}

//ROJECT STATE MANAGEMENT
class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState;
        return this.instance;
    }

    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(Math.random().toString(), title, description, numOfPeople, ProjectStatus.Active);
        this.projects.push(newProject);

        for (const listenerFN of this.listeners) {
            listenerFN(this.projects.slice()) //we want to send a copy and not the original arr to make sure its not editable; 
        }
    }
}

const projectState = ProjectState.getInstance(); //global state and we will always have our 1 state obj

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
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') { //accessor will auto add a property of the same name and stores the value
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-project-list`)! as HTMLUListElement;
        listEl.innerHTML = ''; //clear content and rerender
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem)
        }
    }

    renderContent() {
        const listId = `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    configure() {
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(x => {
                if (this.type === 'active') {
                    return x.status === ProjectStatus.Active
                } else {
                    return x.status === ProjectStatus.Finished
                }
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    }
}


//ProjectInput class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler.bind(this))
    }

    renderContent(): void {

    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput(); //there is no way for us to check if the return type is a tuple at runtime 

        if (Array.isArray(userInput))//HOW WE CAN CHECK FOR A TUPLE
        {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
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
