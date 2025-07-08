import { Component, signal } from '@angular/core';
import { MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatFormField, MatLabel, FormsModule, MatCardActions, MatInputModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class Login {
  username = signal<string>('');
  password = signal<string>('');
  errorMessage = signal<string>('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void{
    console.info('Username is:' + this.username());
    console.info('Password is:' + this.password());
    if(this.authService.login(this.username(), this.password())){
      this.errorMessage.set('');
    }else {
      this.errorMessage.set('Invalid credentials. Use admin');
    }
  }
}
