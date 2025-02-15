import { 
    Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    Column, 
    OneToMany, 
    CreateDateColumn, 
    Index 
} from "typeorm";
import { User } from "./user.entity";
import { ActionableStep } from "./actionableStep.entity"; 

@Entity("doctor_notes") 
@Index(["createdAt"]) // ✅ Only keep this necessary index
export class DoctorNote {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (doctor) => doctor.doctorNotes)
    doctor: User; // ❌ Removed `@Index()`

    @ManyToOne(() => User)
    patient: User; // ❌ Removed `@Index()`

    @Column({ type: "text" })
    encryptedNote: string;

    @CreateDateColumn()
    createdAt: Date; // ❌ Removed redundant `@Index()`, keeping `@Index(["createdAt"])` at the top

    @OneToMany(() => ActionableStep, (actionableStep) => actionableStep.note) 
    actionableSteps: ActionableStep[];
}
