import { 
    Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne, 
    CreateDateColumn, 
    Index 
} from "typeorm";
import { User } from "./user.entity";

@Entity("doctor_patient") 
@Index(["assignedAt"]) // ✅ Only keep necessary indexes
export class DoctorPatient {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.assignedPatients)
    patient: User; 

    @ManyToOne(() => User, (user) => user.assignedDoctors)
    doctor: User;  

    @CreateDateColumn()
    assignedAt: Date;
}
